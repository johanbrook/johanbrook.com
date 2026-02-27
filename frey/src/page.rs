use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Entry {
    pub name: String,
    pub path: String,
    #[serde(rename = "type")]
    pub entry_type: String,
    pub src: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct Src {
    pub path: String,
    pub ext: String,
    pub entry: Option<Entry>,
}

/// Well-known fields plus a catch-all.
#[derive(Debug, Clone, Serialize)]
pub struct PageData {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub basename: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub draft: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub date: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub layout: Option<String>,
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    pub page_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lang: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slug: Option<String>,
    /// Catch-all for arbitrary data fields from frontmatter/cascade.
    #[serde(flatten)]
    pub extra: serde_json::Map<String, serde_json::Value>,
}

impl PageData {
    /// Build a PageData from a merged frontmatter + cascade map.
    /// Known fields are extracted into typed fields; the rest goes into `extra`.
    pub fn from_map(mut map: serde_json::Map<String, serde_json::Value>) -> Self {
        let title = map
            .remove("title")
            .and_then(|v| v.as_str().map(String::from));
        let url = map.remove("url").and_then(|v| v.as_str().map(String::from));
        let basename = map
            .remove("basename")
            .and_then(|v| v.as_str().map(String::from));
        let draft = map.remove("draft").and_then(|v| v.as_bool());
        let date = map
            .remove("date")
            .and_then(|v| v.as_str().map(String::from));
        let content = map
            .remove("content")
            .and_then(|v| v.as_str().map(String::from));
        let layout = map
            .remove("layout")
            .and_then(|v| v.as_str().map(String::from));
        let page_type = map
            .remove("type")
            .and_then(|v| v.as_str().map(String::from));
        let id = map.remove("id").and_then(|v| v.as_str().map(String::from));
        let lang = map
            .remove("lang")
            .and_then(|v| v.as_str().map(String::from));
        let slug = map
            .remove("slug")
            .and_then(|v| v.as_str().map(String::from));

        Self {
            title,
            url,
            basename,
            draft,
            date,
            content,
            layout,
            page_type,
            id,
            lang,
            slug,
            extra: map,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct Page {
    pub src: Src,
    pub data: PageData,
}

impl Page {
    /// Build a Page from a relative path and a merged data map.
    pub fn build(
        rel_path: &std::path::Path,
        data_map: serde_json::Map<String, serde_json::Value>,
        src_root: &str,
    ) -> Self {
        let ext = rel_path
            .extension()
            .map(|e| format!(".{}", e.to_string_lossy()))
            .unwrap_or_default();
        let stem = rel_path
            .file_stem()
            .map(|s| s.to_string_lossy().into_owned())
            .unwrap_or_default();

        let src = Src {
            path: rel_path.with_extension("").to_string_lossy().into_owned(),
            ext,
            entry: Some(Entry {
                name: stem,
                path: rel_path.to_string_lossy().into_owned(),
                entry_type: "file".to_string(),
                src: src_root.to_string(),
            }),
        };

        let data = PageData::from_map(data_map);

        Self { src, data }
    }
}
