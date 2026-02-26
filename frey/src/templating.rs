use std::collections::HashMap;
use std::hash::{DefaultHasher, Hash, Hasher};
use std::path::Path;
use std::sync::Arc;
use std::{fs, io};

use crate::build::{parse_frontmatter, split_frontmatter};
use crate::eda::{Template, TemplateError};

const MAX_INCLUDE_DEPTH: usize = 16;

/// Manages template partials, include resolution, and compiled template caching.
///
/// Designed for use across threads: partials are shared via `Arc`, and each
/// thread gets its own compiled template cache (via cheap `Clone`).
pub struct TemplateStore {
    partials: Arc<HashMap<String, String>>,
    location: Arc<String>,
    cache: HashMap<u64, Template>,
}

impl Clone for TemplateStore {
    fn clone(&self) -> Self {
        Self {
            partials: Arc::clone(&self.partials),
            location: Arc::clone(&self.location),
            cache: HashMap::new(),
        }
    }
}

impl TemplateStore {
    /// Load all partials from `includes_dir` recursively.
    /// Keys are relative paths like "layouts/main.vto", "nav.vto".
    pub fn load(includes_dir: &Path, location: String) -> io::Result<Self> {
        let mut partials = HashMap::new();

        if includes_dir.is_dir() {
            load_partials(includes_dir, includes_dir, &mut partials)?;
        }

        Ok(Self {
            partials: Arc::new(partials),
            location: Arc::new(location),
            cache: HashMap::new(),
        })
    }

    /// Render a template source string with the given data context.
    ///
    /// 1. Resolve all `{{ include "..." }}` directives by inlining partials
    /// 2. Check cache by hash of resolved source
    /// 3. Compile on cache miss
    /// 4. Render with data
    pub fn render(
        &mut self,
        source: &str,
        data: &serde_json::Value,
    ) -> Result<String, RenderError> {
        let resolved = self.resolve_includes(source, 0)?;

        let hash = {
            let mut hasher = DefaultHasher::new();
            resolved.hash(&mut hasher);
            hasher.finish()
        };

        let template = self
            .cache
            .entry(hash)
            .or_insert_with(|| Template::from_str(&resolved));

        template
            .render(data, &self.location)
            .map_err(RenderError::Template)
    }

    /// Render a template body, then wrap it in its layout chain.
    ///
    /// If `data` contains a `layout` key pointing to a `.vto` partial, the rendered
    /// content is injected as `{{ content }}` into that layout. Layouts can themselves
    /// specify a parent layout, forming a chain up to `MAX_INCLUDE_DEPTH` levels deep.
    pub fn render_with_layout(
        &mut self,
        body: &str,
        data: &serde_json::Map<String, serde_json::Value>,
    ) -> Result<String, RenderError> {
        self.render_with_layout_inner(body, data, 0)
    }

    fn render_with_layout_inner(
        &mut self,
        body: &str,
        data: &serde_json::Map<String, serde_json::Value>,
        depth: usize,
    ) -> Result<String, RenderError> {
        if depth > MAX_INCLUDE_DEPTH {
            return Err(RenderError::IncludeDepth);
        }

        let rendered = self.render(body, &serde_json::Value::Object(data.clone()))?;

        let layout_key = data.get("layout");
        let layout_path = match layout_key {
            Some(serde_json::Value::String(s)) if !s.is_empty() => s.clone(),
            _ => return Ok(rendered),
        };

        // Only support .vto layouts; silently skip others
        if !layout_path.ends_with(".vto") {
            return Ok(rendered);
        }

        let layout_source = match self.partials.get(&layout_path) {
            Some(src) => src.clone(),
            None => return Err(RenderError::PartialNotFound(layout_path)),
        };

        let (layout_fm, layout_body) = split_frontmatter(&layout_source);
        let mut merged = layout_fm.map(parse_frontmatter).unwrap_or_default();

        // Caller data wins over layout data (except content and layout)
        for (k, v) in data {
            if k != "content" && k != "layout" {
                merged.insert(k.clone(), v.clone());
            }
        }
        // Inject rendered content
        merged.insert(
            "content".to_string(),
            serde_json::Value::String(rendered),
        );

        self.render_with_layout_inner(layout_body, &merged, depth + 1)
    }

    /// Recursively resolve `{{ include "path" }}` directives in `source`.
    fn resolve_includes(&self, source: &str, depth: usize) -> Result<String, RenderError> {
        if depth > MAX_INCLUDE_DEPTH {
            return Err(RenderError::IncludeDepth);
        }

        let mut result = String::with_capacity(source.len());
        let mut rest = source;

        while let Some(start) = rest.find("{{ include \"") {
            // Append text before the include tag
            result.push_str(&rest[..start]);

            let after_open = &rest[start + 12..]; // skip `{{ include "`
            if let Some(quote_end) = after_open.find('"') {
                let path = &after_open[..quote_end];
                let after_quote = &after_open[quote_end + 1..];

                // Expect closing `}}`
                let closing = after_quote.trim_start();
                if let Some(stripped) = closing.strip_prefix("}}") {
                    rest = stripped;
                } else {
                    // Malformed — treat as literal text
                    result.push_str(&rest[..start + 12 + quote_end + 1]);
                    rest = after_quote;
                    continue;
                }

                // Look up the partial
                if let Some(partial_source) = self.partials.get(path) {
                    let resolved = self.resolve_includes(partial_source, depth + 1)?;
                    result.push_str(&resolved);
                } else {
                    return Err(RenderError::PartialNotFound(path.to_string()));
                }
            } else {
                // No closing quote — treat rest as literal
                result.push_str(&rest[start..]);
                return Ok(result);
            }
        }

        result.push_str(rest);
        Ok(result)
    }
}

#[derive(Debug)]
pub enum RenderError {
    Template(TemplateError),
    PartialNotFound(String),
    IncludeDepth,
}

impl std::fmt::Display for RenderError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RenderError::Template(e) => write!(f, "{e}"),
            RenderError::PartialNotFound(name) => write!(f, "partial not found: {name}"),
            RenderError::IncludeDepth => write!(f, "include depth limit exceeded"),
        }
    }
}

impl std::error::Error for RenderError {}

fn load_partials(
    dir: &Path,
    root: &Path,
    partials: &mut HashMap<String, String>,
) -> io::Result<()> {
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_dir() {
            load_partials(&path, root, partials)?;
        } else {
            let rel = path
                .strip_prefix(root)
                .expect("partial path must be under includes root");
            let key = rel.to_string_lossy().to_string();
            let content = fs::read_to_string(&path)?;
            partials.insert(key, content);
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::sync::atomic::{AtomicU32, Ordering};

    static COUNTER: AtomicU32 = AtomicU32::new(0);

    fn temp_store(files: &[(&str, &str)]) -> TemplateStore {
        let id = COUNTER.fetch_add(1, Ordering::Relaxed);
        let dir = std::env::temp_dir().join(format!("frey_test_{}_{id}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();

        for (name, content) in files {
            let path = dir.join(name);
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent).unwrap();
            }
            fs::write(path, content).unwrap();
        }

        let store = TemplateStore::load(&dir, "http://localhost:3000".to_string()).unwrap();
        let _ = fs::remove_dir_all(&dir);
        store
    }

    #[test]
    fn load_partials_from_dir() {
        let store = temp_store(&[
            ("header.vto", "<header>{{ title }}</header>"),
            ("layouts/main.vto", "<html>{{ content }}</html>"),
        ]);

        assert_eq!(store.partials.len(), 2);
        assert!(store.partials.contains_key("header.vto"));
        assert!(store.partials.contains_key("layouts/main.vto"));
    }

    #[test]
    fn load_empty_dir() {
        let dir = std::env::temp_dir().join("frey_test_empty");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();

        let store = TemplateStore::load(&dir, "http://localhost:3000".to_string()).unwrap();
        assert!(store.partials.is_empty());

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn load_nonexistent_dir() {
        let store = TemplateStore::load(Path::new("/tmp/frey_nonexistent_dir"), "http://localhost:3000".to_string()).unwrap();
        assert!(store.partials.is_empty());
    }

    #[test]
    fn render_simple() {
        let mut store = temp_store(&[]);
        let result = store
            .render("Hello {{ name }}!", &serde_json::json!({"name": "Johan"}))
            .unwrap();
        assert_eq!(result, "Hello Johan!");
    }

    #[test]
    fn render_with_include() {
        let mut store = temp_store(&[("nav.vto", "<nav>{{ siteName }}</nav>")]);
        let result = store
            .render(
                r#"{{ include "nav.vto" }}<main>content</main>"#,
                &serde_json::json!({"siteName": "My Site"}),
            )
            .unwrap();
        assert_eq!(result, "<nav>My Site</nav><main>content</main>");
    }

    #[test]
    fn render_nested_includes() {
        let mut store = temp_store(&[
            ("inner.vto", "<span>inner</span>"),
            ("outer.vto", r#"<div>{{ include "inner.vto" }}</div>"#),
        ]);
        let result = store
            .render(r#"{{ include "outer.vto" }}"#, &serde_json::json!({}))
            .unwrap();
        assert_eq!(result, "<div><span>inner</span></div>");
    }

    #[test]
    fn render_missing_partial() {
        let mut store = temp_store(&[]);
        let result = store.render(r#"{{ include "missing.vto" }}"#, &serde_json::json!({}));
        assert!(matches!(result, Err(RenderError::PartialNotFound(_))));
    }

    #[test]
    fn render_caches_compiled_template() {
        let mut store = temp_store(&[]);
        let source = "Hello {{ name }}!";
        let data = serde_json::json!({"name": "A"});

        store.render(source, &data).unwrap();
        assert_eq!(store.cache.len(), 1);

        // Same source should hit cache (not increase cache size)
        store
            .render(source, &serde_json::json!({"name": "B"}))
            .unwrap();
        assert_eq!(store.cache.len(), 1);
    }

    #[test]
    fn clone_shares_partials_not_cache() {
        let mut store = temp_store(&[("a.vto", "hello")]);
        store.render("test", &serde_json::json!({})).unwrap();
        assert_eq!(store.cache.len(), 1);

        let cloned = store.clone();
        assert_eq!(cloned.partials.len(), 1);
        assert_eq!(cloned.cache.len(), 0); // Cache is not shared
    }

    #[test]
    fn layout_wrapping_simple() {
        let mut store = temp_store(&[(
            "layouts/main.vto",
            "<html><body>{{ content }}</body></html>",
        )]);
        let mut data = serde_json::Map::new();
        data.insert(
            "layout".to_string(),
            serde_json::Value::String("layouts/main.vto".to_string()),
        );
        let result = store
            .render_with_layout("<p>Hello</p>", &data)
            .unwrap();
        assert_eq!(result, "<html><body><p>Hello</p></body></html>");
    }

    #[test]
    fn layout_wrapping_with_variables() {
        let mut store = temp_store(&[(
            "layouts/page.vto",
            "<html><title>{{ title }}</title><body>{{ content }}</body></html>",
        )]);
        let mut data = serde_json::Map::new();
        data.insert(
            "layout".to_string(),
            serde_json::Value::String("layouts/page.vto".to_string()),
        );
        data.insert(
            "title".to_string(),
            serde_json::Value::String("My Page".to_string()),
        );
        let result = store
            .render_with_layout("<p>Body</p>", &data)
            .unwrap();
        assert_eq!(
            result,
            "<html><title>My Page</title><body><p>Body</p></body></html>"
        );
    }

    #[test]
    fn layout_chaining() {
        let mut store = temp_store(&[
            (
                "layouts/main.vto",
                "<html>{{ content }}</html>",
            ),
            (
                "layouts/page.vto",
                "---\nlayout: layouts/main.vto\n---\n<article>{{ content }}</article>",
            ),
        ]);
        let mut data = serde_json::Map::new();
        data.insert(
            "layout".to_string(),
            serde_json::Value::String("layouts/page.vto".to_string()),
        );
        let result = store
            .render_with_layout("<p>Hello</p>", &data)
            .unwrap();
        assert_eq!(result, "<html><article><p>Hello</p></article></html>");
    }

    #[test]
    fn layout_null_skips_wrapping() {
        let mut store = temp_store(&[(
            "layouts/main.vto",
            "<html>{{ content }}</html>",
        )]);
        let mut data = serde_json::Map::new();
        data.insert("layout".to_string(), serde_json::Value::Null);
        let result = store
            .render_with_layout("<p>Raw</p>", &data)
            .unwrap();
        assert_eq!(result, "<p>Raw</p>");
    }

    #[test]
    fn no_layout_key_skips_wrapping() {
        let mut store = temp_store(&[]);
        let data = serde_json::Map::new();
        let result = store
            .render_with_layout("<p>Raw</p>", &data)
            .unwrap();
        assert_eq!(result, "<p>Raw</p>");
    }

    #[test]
    fn non_vto_layout_skips_wrapping() {
        let mut store = temp_store(&[]);
        let mut data = serde_json::Map::new();
        data.insert(
            "layout".to_string(),
            serde_json::Value::String("layouts/old.njk".to_string()),
        );
        let result = store
            .render_with_layout("<p>Content</p>", &data)
            .unwrap();
        assert_eq!(result, "<p>Content</p>");
    }
}
