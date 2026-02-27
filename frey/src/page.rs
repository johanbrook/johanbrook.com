use serde::Serialize;
use serde::ser::{SerializeMap, Serializer};
use std::path::{Path, PathBuf};
use temporal_rs::PlainDateTime;

/// A resolved source file with guaranteed metadata.
/// Produced after parsing frontmatter and merging cascade data.
#[derive(Debug, Clone)]
pub struct File {
    pub src: PathBuf,
    pub dest: PathBuf,
    pub url: String,
    pub date: PlainDateTime,
    pub draft: bool,
    pub body: String,
    pub layout: Option<String>,
    pub data: serde_json::Map<String, serde_json::Value>,
    pub js_sources: Vec<String>,
}

impl File {
    pub fn new(
        src: PathBuf,
        body: String,
        mut data: serde_json::Map<String, serde_json::Value>,
        js_sources: Vec<String>,
    ) -> Self {
        let date = data
            .get("date")
            .and_then(|v| v.as_str())
            .and_then(|s| s.parse::<PlainDateTime>().ok())
            .unwrap_or_else(|| Self::date_from_file(&src));

        let draft = data.get("draft").and_then(|v| v.as_bool()).unwrap_or(false);

        let layout = data
            .remove("layout")
            .and_then(|v| v.as_str().map(String::from));

        // Extract static url string from data if present
        let url = data
            .get("url")
            .and_then(|v| v.as_str())
            .map(String::from)
            .unwrap_or_default();

        File {
            src,
            dest: PathBuf::new(),
            url,
            date,
            draft,
            body,
            layout,
            data,
            js_sources,
        }
    }

    /// Resolve the URL and destination path for this file.
    ///
    /// `rel_path` is the source path relative to the src root.
    /// Sets `self.url` and `self.dest` (both relative — no dest_root prefix).
    /// Returns `false` if the file should be skipped (url: false).
    pub fn resolve_url(&mut self, rel_path: &Path) -> bool {
        // 1. If url already set from static data in new(), derive dest from it
        if !self.url.is_empty() {
            self.dest = url_to_dest(&self.url);
            self.data.insert(
                "url".to_string(),
                serde_json::Value::String(self.url.clone()),
            );
            return true;
        }

        // 2. Try JS url function if js_sources present
        if !self.js_sources.is_empty() {
            let page_json = serde_json::to_string(self).unwrap_or_default();
            match crate::eda::call_js_function(&self.js_sources, "url", &page_json) {
                Ok(Some(serde_json::Value::String(s))) => {
                    self.url = s;
                    self.dest = url_to_dest(&self.url);
                    self.data.insert(
                        "url".to_string(),
                        serde_json::Value::String(self.url.clone()),
                    );
                    return true;
                }
                Ok(Some(serde_json::Value::Bool(false))) => return false,
                Ok(_) => {}
                Err(e) => {
                    eprintln!(
                        "Warning: url function failed for {}: {e}",
                        rel_path.display()
                    );
                }
            }
        }

        // 3. Check if data has url: false
        if let Some(serde_json::Value::Bool(false)) = self.data.get("url") {
            return false;
        }

        // 4. Default URL from rel_path
        self.url = default_url(rel_path);
        self.dest = default_dest(rel_path);
        self.data.insert(
            "url".to_string(),
            serde_json::Value::String(self.url.clone()),
        );
        true
    }

    /// Get a PlainDateTime from a file's creation time, falling back to epoch.
    fn date_from_file(path: &Path) -> PlainDateTime {
        std::fs::metadata(path)
            .and_then(|m| m.created())
            .ok()
            .and_then(|t| {
                let dur = t.duration_since(std::time::UNIX_EPOCH).ok()?;
                let secs = dur.as_secs();
                // Convert to date components
                let days = (secs / 86400) as i64;
                let time_secs = (secs % 86400) as u32;
                // Simple days-to-date conversion (from Unix epoch 1970-01-01)
                let (year, month, day) = days_to_ymd(days);
                let hour = (time_secs / 3600) as u8;
                let minute = ((time_secs % 3600) / 60) as u8;
                let second = (time_secs % 60) as u8;
                PlainDateTime::try_new_iso(year, month, day, hour, minute, second, 0, 0, 0).ok()
            })
            .unwrap_or_else(|| PlainDateTime::try_new_iso(1970, 1, 1, 0, 0, 0, 0, 0, 0).unwrap())
    }
}

/// Convert a URL string to a relative dest path.
/// e.g. `/writings/hello/` → `writings/hello/index.html`
///      `/feed.xml` → `feed.xml`
///      `/` → `index.html`
fn url_to_dest(url: &str) -> PathBuf {
    let s = url.trim_start_matches('/');
    if s.is_empty() {
        PathBuf::from("index.html")
    } else if s.ends_with('/') {
        PathBuf::from(s).join("index.html")
    } else {
        PathBuf::from(s)
    }
}

/// Derive a default pretty URL from a relative source path.
/// e.g. `posts/foo.md` → `/posts/foo/`
///      `index.md` → `/`
///      `about.md` → `/about/`
fn default_url(rel_path: &Path) -> String {
    let stem = rel_path.file_stem().unwrap().to_string_lossy();
    if stem == "index" {
        let parent = rel_path.parent().unwrap_or(Path::new(""));
        if parent == Path::new("") {
            "/".to_string()
        } else {
            format!("/{}/", parent.to_string_lossy())
        }
    } else {
        let parent = rel_path.parent().unwrap_or(Path::new(""));
        if parent == Path::new("") {
            format!("/{stem}/")
        } else {
            format!("/{}/{stem}/", parent.to_string_lossy())
        }
    }
}

/// Derive a default relative dest path from a relative source path.
/// e.g. `posts/foo.md` → `posts/foo/index.html`
///      `index.md` → `index.html`
fn default_dest(rel_path: &Path) -> PathBuf {
    let stem = rel_path.file_stem().unwrap().to_string_lossy();
    if stem == "index" {
        rel_path.with_file_name("index.html")
    } else {
        let parent = rel_path.parent().unwrap_or(Path::new(""));
        parent.join(stem.as_ref()).join("index.html")
    }
}

/// Convert days since Unix epoch to (year, month, day).
fn days_to_ymd(days: i64) -> (i32, u8, u8) {
    // Civil days algorithm from Howard Hinnant
    let z = days + 719468;
    let era = if z >= 0 { z } else { z - 146096 } / 146097;
    let doe = (z - era * 146097) as u64;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = (yoe as i64 + era * 400) as i32;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = (doy - (153 * mp + 2) / 5 + 1) as u8;
    let m = if mp < 10 { mp + 3 } else { mp - 9 } as u8;
    let y = if m <= 2 { y + 1 } else { y };
    (y, m, d)
}

impl Serialize for File {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let len = 7 + self.layout.is_some() as usize;
        let mut map = serializer.serialize_map(Some(len))?;
        map.serialize_entry("src", &self.src.to_string_lossy())?;
        map.serialize_entry("dest", &self.dest.to_string_lossy())?;
        map.serialize_entry("url", &self.url)?;
        map.serialize_entry("date", &self.date.to_string())?;
        map.serialize_entry("draft", &self.draft)?;
        map.serialize_entry("body", &self.body)?;
        if let Some(ref layout) = self.layout {
            map.serialize_entry("layout", layout)?;
        }
        map.serialize_entry("data", &self.data)?;
        map.end()
    }
}

/// The final rendered product. Templates receive collections of Pages.
#[derive(Debug, Clone)]
pub struct Page {
    pub file: File,
    pub rendered: String,
}

impl Serialize for Page {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let len = 8 + self.file.layout.is_some() as usize;
        let mut map = serializer.serialize_map(Some(len))?;
        map.serialize_entry("src", &self.file.src.to_string_lossy())?;
        map.serialize_entry("dest", &self.file.dest.to_string_lossy())?;
        map.serialize_entry("url", &self.file.url)?;
        map.serialize_entry("date", &self.file.date.to_string())?;
        map.serialize_entry("draft", &self.file.draft)?;
        map.serialize_entry("content", &self.rendered)?;
        if let Some(ref layout) = self.file.layout {
            map.serialize_entry("layout", layout)?;
        }
        map.serialize_entry("data", &self.file.data)?;
        map.end()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::{Map, Value, json};

    fn make_data(pairs: &[(&str, Value)]) -> Map<String, Value> {
        pairs
            .iter()
            .map(|(k, v)| (k.to_string(), v.clone()))
            .collect()
    }

    #[test]
    fn new_parses_date_from_data() {
        let data = make_data(&[("date", json!("2024-03-15"))]);
        let file = File::new(PathBuf::from("fake.md"), String::new(), data, vec![]);
        assert_eq!(file.date.year(), 2024);
        assert_eq!(file.date.month(), 3);
        assert_eq!(file.date.day(), 15);
    }

    #[test]
    fn new_parses_datetime_from_data() {
        let data = make_data(&[("date", json!("2024-03-15T10:30:00"))]);
        let file = File::new(PathBuf::from("fake.md"), String::new(), data, vec![]);
        assert_eq!(file.date.year(), 2024);
        assert_eq!(file.date.hour(), 10);
        assert_eq!(file.date.minute(), 30);
    }

    #[test]
    fn new_falls_back_to_file_date() {
        // No date in data, nonexistent file → falls back to epoch
        let file = File::new(
            PathBuf::from("/nonexistent/fake.md"),
            String::new(),
            Map::new(),
            vec![],
        );
        assert_eq!(file.date.year(), 1970);
        assert_eq!(file.date.month(), 1);
        assert_eq!(file.date.day(), 1);
    }

    #[test]
    fn new_ignores_invalid_date_string() {
        let data = make_data(&[("date", json!("not-a-date"))]);
        let file = File::new(
            PathBuf::from("/nonexistent/fake.md"),
            String::new(),
            data,
            vec![],
        );
        // Falls back to file/epoch
        assert_eq!(file.date.year(), 1970);
    }

    #[test]
    fn new_extracts_draft_true() {
        let data = make_data(&[("draft", json!(true))]);
        let file = File::new(PathBuf::from("fake.md"), String::new(), data, vec![]);
        assert!(file.draft);
    }

    #[test]
    fn new_defaults_draft_false() {
        let file = File::new(PathBuf::from("fake.md"), String::new(), Map::new(), vec![]);
        assert!(!file.draft);
    }

    #[test]
    fn new_extracts_and_removes_layout() {
        let data = make_data(&[("layout", json!("base.vto")), ("title", json!("Hello"))]);
        let file = File::new(PathBuf::from("fake.md"), String::new(), data, vec![]);
        assert_eq!(file.layout.as_deref(), Some("base.vto"));
        // layout should be removed from the data map
        assert!(!file.data.contains_key("layout"));
        // other keys remain
        assert_eq!(file.data.get("title").unwrap(), "Hello");
    }

    #[test]
    fn new_preserves_extra_data() {
        let data = make_data(&[
            ("title", json!("Hello")),
            ("slug", json!("hello-world")),
            ("tags", json!(["rust", "web"])),
        ]);
        let file = File::new(PathBuf::from("fake.md"), "body".into(), data, vec![]);
        assert_eq!(file.data.get("slug").unwrap(), "hello-world");
        assert_eq!(file.data.get("tags").unwrap(), &json!(["rust", "web"]));
        assert_eq!(file.body, "body");
    }

    #[test]
    fn new_starts_with_empty_url_and_dest() {
        let file = File::new(PathBuf::from("fake.md"), String::new(), Map::new(), vec![]);
        assert_eq!(file.url, "");
        assert_eq!(file.dest, PathBuf::new());
    }

    #[test]
    fn new_extracts_static_url_from_data() {
        let data = make_data(&[("url", json!("/custom/path/"))]);
        let file = File::new(PathBuf::from("fake.md"), String::new(), data, vec![]);
        assert_eq!(file.url, "/custom/path/");
    }

    #[test]
    fn new_ignores_non_string_url() {
        let data = make_data(&[("url", json!(false))]);
        let file = File::new(PathBuf::from("fake.md"), String::new(), data, vec![]);
        assert_eq!(file.url, "");
    }

    // --- url_to_dest ---

    #[test]
    fn url_to_dest_trailing_slash() {
        assert_eq!(
            super::url_to_dest("/writings/hello/"),
            PathBuf::from("writings/hello/index.html")
        );
    }

    #[test]
    fn url_to_dest_with_extension() {
        assert_eq!(super::url_to_dest("/feed.xml"), PathBuf::from("feed.xml"));
    }

    #[test]
    fn url_to_dest_root() {
        assert_eq!(super::url_to_dest("/"), PathBuf::from("index.html"));
    }

    #[test]
    fn url_to_dest_no_trailing_slash() {
        assert_eq!(super::url_to_dest("/CNAME"), PathBuf::from("CNAME"));
    }

    // --- default_url ---

    #[test]
    fn default_url_index() {
        assert_eq!(super::default_url(Path::new("index.md")), "/");
    }

    #[test]
    fn default_url_about() {
        assert_eq!(super::default_url(Path::new("about.md")), "/about/");
    }

    #[test]
    fn default_url_nested() {
        assert_eq!(super::default_url(Path::new("posts/foo.md")), "/posts/foo/");
    }

    #[test]
    fn default_url_nested_index() {
        assert_eq!(super::default_url(Path::new("posts/index.md")), "/posts/");
    }

    // --- default_dest ---

    #[test]
    fn default_dest_index() {
        assert_eq!(
            super::default_dest(Path::new("index.md")),
            PathBuf::from("index.html")
        );
    }

    #[test]
    fn default_dest_about() {
        assert_eq!(
            super::default_dest(Path::new("about.md")),
            PathBuf::from("about/index.html")
        );
    }

    #[test]
    fn default_dest_nested() {
        assert_eq!(
            super::default_dest(Path::new("posts/foo.md")),
            PathBuf::from("posts/foo/index.html")
        );
    }

    // --- resolve_url ---

    #[test]
    fn resolve_url_with_static_url() {
        let data = make_data(&[("url", json!("/writings/hello/"))]);
        let mut file = File::new(PathBuf::from("fake.md"), String::new(), data, vec![]);
        assert!(file.resolve_url(Path::new("posts/foo.md")));
        assert_eq!(file.url, "/writings/hello/");
        assert_eq!(file.dest, PathBuf::from("writings/hello/index.html"));
    }

    #[test]
    fn resolve_url_with_false_in_data() {
        let data = make_data(&[("url", json!(false))]);
        let mut file = File::new(PathBuf::from("fake.md"), String::new(), data, vec![]);
        assert!(!file.resolve_url(Path::new("draft.md")));
    }

    #[test]
    fn resolve_url_default_pretty_url() {
        let mut file = File::new(PathBuf::from("fake.md"), String::new(), Map::new(), vec![]);
        assert!(file.resolve_url(Path::new("about.md")));
        assert_eq!(file.url, "/about/");
        assert_eq!(file.dest, PathBuf::from("about/index.html"));
    }

    #[test]
    fn resolve_url_default_index() {
        let mut file = File::new(PathBuf::from("fake.md"), String::new(), Map::new(), vec![]);
        assert!(file.resolve_url(Path::new("index.md")));
        assert_eq!(file.url, "/");
        assert_eq!(file.dest, PathBuf::from("index.html"));
    }

    #[test]
    fn resolve_url_inserts_url_into_data() {
        let mut file = File::new(PathBuf::from("fake.md"), String::new(), Map::new(), vec![]);
        file.resolve_url(Path::new("about.md"));
        assert_eq!(file.data.get("url").unwrap(), "/about/");
    }

    #[test]
    fn serialize_file_shape() {
        let data = make_data(&[("slug", json!("hello"))]);
        let mut file = File::new(
            PathBuf::from("src/posts/hello.md"),
            "# Hi".into(),
            data,
            vec![],
        );
        file.url = "/writings/hello/".into();
        file.dest = PathBuf::from("build/writings/hello/index.html");

        let json: Value = serde_json::to_value(&file).unwrap();
        assert_eq!(json["src"], "src/posts/hello.md");
        assert_eq!(json["dest"], "build/writings/hello/index.html");
        assert_eq!(json["url"], "/writings/hello/");
        assert_eq!(json["draft"], false);
        assert_eq!(json["body"], "# Hi");
        assert_eq!(json["data"]["slug"], "hello");
        // layout absent when None
        assert!(json.get("layout").is_none());
    }

    #[test]
    fn serialize_file_includes_layout() {
        let data = make_data(&[("layout", json!("base.vto"))]);
        let file = File::new(PathBuf::from("fake.md"), String::new(), data, vec![]);
        let json: Value = serde_json::to_value(&file).unwrap();
        assert_eq!(json["layout"], "base.vto");
    }

    #[test]
    fn serialize_page_has_content() {
        let file = File::new(PathBuf::from("fake.md"), String::new(), Map::new(), vec![]);
        let page = Page {
            file,
            rendered: "<p>Hello</p>".into(),
        };
        let json: Value = serde_json::to_value(&page).unwrap();
        assert_eq!(json["content"], "<p>Hello</p>");
        // Page should not have body
        assert!(json.get("body").is_none());
    }

    #[test]
    fn days_to_ymd_epoch() {
        assert_eq!(days_to_ymd(0), (1970, 1, 1));
    }

    #[test]
    fn days_to_ymd_known_date() {
        // 2024-03-15 is day 19797 since epoch
        assert_eq!(days_to_ymd(19797), (2024, 3, 15));
    }
}
