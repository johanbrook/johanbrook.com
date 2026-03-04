use serde_json::Value;

/// OR of AND groups: `"type=post | type=recipe"` → two groups.
struct Query {
    groups: Vec<AndGroup>,
}

/// AND of filters: `"type=post draft=false"` → two filters.
struct AndGroup {
    filters: Vec<Filter>,
}

struct Filter {
    key: String,
    value: String,
}

fn parse_query(s: &str) -> Query {
    let s = s.trim();
    if s.is_empty() {
        return Query { groups: vec![] };
    }

    let groups = s
        .split('|')
        .map(|group| {
            let filters = group
                .split_whitespace()
                .filter_map(|pair| {
                    let (key, value) = pair.split_once('=')?;
                    Some(Filter {
                        key: key.to_string(),
                        value: value.to_string(),
                    })
                })
                .collect();
            AndGroup { filters }
        })
        .collect();

    Query { groups }
}

/// Traverse dotted key path like `"menu.visible"` into nested JSON.
fn get_nested<'a>(data: &'a Value, dotted_key: &str) -> Option<&'a Value> {
    let mut current = data;
    for part in dotted_key.split('.') {
        current = current.get(part)?;
    }
    Some(current)
}

/// Check if a single filter matches a page's data.
fn filter_matches(page: &Value, filter: &Filter) -> bool {
    let Some(val) = get_nested(page, &filter.key) else {
        return false;
    };

    match val {
        // Array membership: `tags=rust` matches if array contains "rust"
        Value::Array(arr) => arr.iter().any(|item| value_eq_str(item, &filter.value)),
        _ => value_eq_str(val, &filter.value),
    }
}

/// Compare a JSON value to a string with coercion.
fn value_eq_str(val: &Value, s: &str) -> bool {
    match val {
        Value::String(v) => v == s,
        Value::Bool(b) => (s == "true" && *b) || (s == "false" && !*b),
        Value::Number(n) => n.to_string() == s,
        Value::Null => s == "null",
        _ => false,
    }
}

fn matches(page: &Value, query: &Query) -> bool {
    if query.groups.is_empty() {
        return true;
    }
    query.groups.iter().any(|group| {
        group
            .filters
            .iter()
            .all(|filter| filter_matches(page, filter))
    })
}

enum SortOrder {
    Asc,
    Desc,
}

struct SortSpec {
    key: String,
    order: SortOrder,
}

/// Parse a sort string like `"date=desc"` or `"title=asc"`.
fn parse_sort(s: &str) -> Option<SortSpec> {
    let s = s.trim();
    if s.is_empty() {
        return None;
    }
    let (key, value) = s.split_once('=')?;
    let order = match value.trim() {
        "asc" => SortOrder::Asc,
        "desc" => SortOrder::Desc,
        _ => return None,
    };
    Some(SortSpec {
        key: key.trim().to_string(),
        order,
    })
}

fn sort_pages(pages: &mut [Value], spec: Option<&SortSpec>) {
    let spec = match spec {
        Some(s) => s,
        None => {
            // Default: sort by date descending
            pages.sort_by(|a, b| {
                let da = a.get("date").and_then(|v| v.as_str()).unwrap_or("");
                let db = b.get("date").and_then(|v| v.as_str()).unwrap_or("");
                db.cmp(da)
            });
            return;
        }
    };

    pages.sort_by(|a, b| {
        let va = get_nested(a, &spec.key)
            .map(value_sort_key)
            .unwrap_or_default();
        let vb = get_nested(b, &spec.key)
            .map(value_sort_key)
            .unwrap_or_default();
        match spec.order {
            SortOrder::Asc => va.cmp(&vb),
            SortOrder::Desc => vb.cmp(&va),
        }
    });
}

/// Produce a string suitable for lexicographic sorting.
fn value_sort_key(val: &Value) -> String {
    match val {
        Value::String(s) => s.clone(),
        Value::Number(n) => format!("{:020}", n.as_f64().unwrap_or(0.0)),
        Value::Bool(b) => b.to_string(),
        Value::Null => String::new(),
        _ => val.to_string(),
    }
}

/// Find all pages matching a query, with optional sort and limit.
///
/// - `sort`: e.g. `"date=desc"`, `"title=asc"`. Defaults to `date=desc`.
/// - `limit`: max number of results. `0` or `None` means no limit.
pub fn find(pages: &[Value], query: &str, sort: Option<&str>, limit: Option<usize>) -> Vec<Value> {
    let q = parse_query(query);
    let mut results: Vec<Value> = pages.iter().filter(|p| matches(p, &q)).cloned().collect();
    let sort_spec = sort.and_then(parse_sort);
    sort_pages(&mut results, sort_spec.as_ref());
    if let Some(n) = limit {
        if n > 0 {
            results.truncate(n);
        }
    }
    results
}

/// Find the next page after `current_url` in the filtered+sorted list.
pub fn next(pages: &[Value], current_url: &str, query: &str) -> Option<Value> {
    let sorted = find(pages, query, None, None);
    let pos = sorted
        .iter()
        .position(|p| p.get("url").and_then(|v| v.as_str()) == Some(current_url))?;
    sorted.get(pos + 1).cloned()
}

/// Find the previous page before `current_url` in the filtered+sorted list.
pub fn prev(pages: &[Value], current_url: &str, query: &str) -> Option<Value> {
    let sorted = find(pages, query, None, None);
    let pos = sorted
        .iter()
        .position(|p| p.get("url").and_then(|v| v.as_str()) == Some(current_url))?;
    if pos == 0 {
        None
    } else {
        sorted.get(pos - 1).cloned()
    }
}

/// Collect unique values for a given key across matching pages.
/// Arrays are flattened: if `tags: ["rust", "web"]`, each element is yielded individually.
pub fn values(pages: &[Value], key: &str, query: Option<&str>) -> Vec<Value> {
    let q = parse_query(query.unwrap_or(""));
    let mut seen = std::collections::HashSet::new();
    let mut result = Vec::new();

    for page in pages {
        if !matches(page, &q) {
            continue;
        }
        let Some(val) = get_nested(page, key) else {
            continue;
        };

        match val {
            Value::Array(arr) => {
                for item in arr {
                    let s = value_to_key(item);
                    if seen.insert(s) {
                        result.push(item.clone());
                    }
                }
            }
            _ => {
                let s = value_to_key(val);
                if seen.insert(s) {
                    result.push(val.clone());
                }
            }
        }
    }

    result
}

/// Create a hashable key from a JSON value for deduplication.
fn value_to_key(val: &Value) -> String {
    match val {
        Value::String(s) => s.clone(),
        Value::Number(n) => n.to_string(),
        Value::Bool(b) => b.to_string(),
        Value::Null => "null".to_string(),
        _ => val.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn sample_pages() -> Vec<Value> {
        vec![
            json!({
                "title": "First Post",
                "url": "/posts/first/",
                "date": "2024-01-15",
                "type": "post",
                "tags": ["rust", "web"],
                "draft": false,
            }),
            json!({
                "title": "Second Post",
                "url": "/posts/second/",
                "date": "2024-03-20",
                "type": "post",
                "tags": ["rust"],
                "draft": false,
            }),
            json!({
                "title": "A Recipe",
                "url": "/recipes/cake/",
                "date": "2024-02-10",
                "type": "recipe",
                "tags": ["food"],
                "draft": false,
            }),
            json!({
                "title": "About",
                "url": "/about/",
                "date": "2023-01-01",
                "type": "page",
                "draft": false,
            }),
        ]
    }

    // --- parse_query ---

    #[test]
    fn parse_empty_query() {
        let q = parse_query("");
        assert!(q.groups.is_empty());
    }

    #[test]
    fn parse_single_filter() {
        let q = parse_query("type=post");
        assert_eq!(q.groups.len(), 1);
        assert_eq!(q.groups[0].filters.len(), 1);
        assert_eq!(q.groups[0].filters[0].key, "type");
        assert_eq!(q.groups[0].filters[0].value, "post");
    }

    #[test]
    fn parse_and_filters() {
        let q = parse_query("type=post draft=false");
        assert_eq!(q.groups.len(), 1);
        assert_eq!(q.groups[0].filters.len(), 2);
    }

    #[test]
    fn parse_or_groups() {
        let q = parse_query("type=post | type=recipe");
        assert_eq!(q.groups.len(), 2);
        assert_eq!(q.groups[0].filters[0].value, "post");
        assert_eq!(q.groups[1].filters[0].value, "recipe");
    }

    // --- matches ---

    #[test]
    fn matches_empty_query_matches_all() {
        let pages = sample_pages();
        let q = parse_query("");
        assert!(pages.iter().all(|p| matches(p, &q)));
    }

    #[test]
    fn matches_simple_filter() {
        let page = json!({"type": "post"});
        assert!(matches(&page, &parse_query("type=post")));
        assert!(!matches(&page, &parse_query("type=recipe")));
    }

    #[test]
    fn matches_bool_coercion() {
        let page = json!({"draft": false});
        assert!(matches(&page, &parse_query("draft=false")));
        assert!(!matches(&page, &parse_query("draft=true")));
    }

    #[test]
    fn matches_array_membership() {
        let page = json!({"tags": ["rust", "web"]});
        assert!(matches(&page, &parse_query("tags=rust")));
        assert!(matches(&page, &parse_query("tags=web")));
        assert!(!matches(&page, &parse_query("tags=python")));
    }

    #[test]
    fn matches_nested_key() {
        let page = json!({"menu": {"visible": true}});
        assert!(matches(&page, &parse_query("menu.visible=true")));
    }

    #[test]
    fn matches_missing_key() {
        let page = json!({"type": "post"});
        assert!(!matches(&page, &parse_query("missing=value")));
    }

    #[test]
    fn matches_or_query() {
        let page = json!({"type": "recipe"});
        assert!(matches(&page, &parse_query("type=post | type=recipe")));
    }

    // --- find ---

    #[test]
    fn find_by_type() {
        let pages = sample_pages();
        let result = find(&pages, "type=post", None, None);
        assert_eq!(result.len(), 2);
        // Sorted by date desc: Second (2024-03-20) before First (2024-01-15)
        assert_eq!(result[0]["title"], "Second Post");
        assert_eq!(result[1]["title"], "First Post");
    }

    #[test]
    fn find_empty_query_returns_all() {
        let pages = sample_pages();
        let result = find(&pages, "", None, None);
        assert_eq!(result.len(), 4);
        // Sorted by date desc
        assert_eq!(result[0]["title"], "Second Post");
    }

    #[test]
    fn find_by_tag() {
        let pages = sample_pages();
        let result = find(&pages, "tags=rust", None, None);
        assert_eq!(result.len(), 2);
    }

    #[test]
    fn find_no_matches() {
        let pages = sample_pages();
        let result = find(&pages, "type=video", None, None);
        assert!(result.is_empty());
    }

    #[test]
    fn find_or_query() {
        let pages = sample_pages();
        let result = find(&pages, "type=post | type=recipe", None, None);
        assert_eq!(result.len(), 3);
    }

    // --- find with sort ---

    #[test]
    fn find_sort_title_asc() {
        let pages = sample_pages();
        let result = find(&pages, "type=post", Some("title=asc"), None);
        assert_eq!(result[0]["title"], "First Post");
        assert_eq!(result[1]["title"], "Second Post");
    }

    #[test]
    fn find_sort_title_desc() {
        let pages = sample_pages();
        let result = find(&pages, "type=post", Some("title=desc"), None);
        assert_eq!(result[0]["title"], "Second Post");
        assert_eq!(result[1]["title"], "First Post");
    }

    #[test]
    fn find_sort_date_asc() {
        let pages = sample_pages();
        let result = find(&pages, "", Some("date=asc"), None);
        assert_eq!(result[0]["title"], "About"); // 2023-01-01
        assert_eq!(result[3]["title"], "Second Post"); // 2024-03-20
    }

    // --- find with limit ---

    #[test]
    fn find_limit() {
        let pages = sample_pages();
        let result = find(&pages, "", None, Some(2));
        assert_eq!(result.len(), 2);
    }

    #[test]
    fn find_limit_zero_means_no_limit() {
        let pages = sample_pages();
        let result = find(&pages, "", None, Some(0));
        assert_eq!(result.len(), 4);
    }

    #[test]
    fn find_limit_larger_than_results() {
        let pages = sample_pages();
        let result = find(&pages, "type=post", None, Some(100));
        assert_eq!(result.len(), 2);
    }

    #[test]
    fn find_sort_and_limit() {
        let pages = sample_pages();
        let result = find(&pages, "", Some("date=asc"), Some(1));
        assert_eq!(result.len(), 1);
        assert_eq!(result[0]["title"], "About"); // oldest
    }

    // --- next / prev ---

    #[test]
    fn next_page() {
        let pages = sample_pages();
        // Posts sorted: Second (2024-03-20), First (2024-01-15)
        let result = next(&pages, "/posts/second/", "type=post");
        assert_eq!(result.unwrap()["title"], "First Post");
    }

    #[test]
    fn next_at_end_returns_none() {
        let pages = sample_pages();
        let result = next(&pages, "/posts/first/", "type=post");
        assert!(result.is_none());
    }

    #[test]
    fn prev_page() {
        let pages = sample_pages();
        let result = prev(&pages, "/posts/first/", "type=post");
        assert_eq!(result.unwrap()["title"], "Second Post");
    }

    #[test]
    fn prev_at_start_returns_none() {
        let pages = sample_pages();
        let result = prev(&pages, "/posts/second/", "type=post");
        assert!(result.is_none());
    }

    #[test]
    fn next_unknown_url_returns_none() {
        let pages = sample_pages();
        let result = next(&pages, "/nonexistent/", "type=post");
        assert!(result.is_none());
    }

    // --- values ---

    #[test]
    fn values_collects_strings() {
        let pages = sample_pages();
        let result = values(&pages, "type", None);
        assert_eq!(result.len(), 3); // post, recipe, page
    }

    #[test]
    fn values_flattens_arrays() {
        let pages = sample_pages();
        let result = values(&pages, "tags", Some("type=post"));
        // First has ["rust", "web"], Second has ["rust"] → unique: rust, web
        assert_eq!(result.len(), 2);
        assert!(result.contains(&json!("rust")));
        assert!(result.contains(&json!("web")));
    }

    #[test]
    fn values_with_query_filter() {
        let pages = sample_pages();
        let result = values(&pages, "tags", Some("type=recipe"));
        assert_eq!(result.len(), 1);
        assert_eq!(result[0], "food");
    }

    #[test]
    fn values_deduplicates() {
        let pages = sample_pages();
        let result = values(&pages, "tags", None);
        // rust appears in two pages but should only appear once
        let rust_count = result.iter().filter(|v| v == &&json!("rust")).count();
        assert_eq!(rust_count, 1);
    }

    #[test]
    fn values_missing_key() {
        let pages = sample_pages();
        let result = values(&pages, "nonexistent", None);
        assert!(result.is_empty());
    }
}
