use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::{fs, io};

use fast_yaml_core::{ParseError, Parser, ScalarOwned, Value};

/// Convert a fast_yaml_core Value to serde_json::Value.
fn yaml_to_json(yaml: &Value) -> serde_json::Value {
    match yaml {
        Value::Mapping(map) => {
            let obj: serde_json::Map<String, serde_json::Value> = map
                .iter()
                .filter_map(|(k, v)| {
                    let key = yaml_key_to_string(k)?;
                    Some((key, yaml_to_json(v)))
                })
                .collect();
            serde_json::Value::Object(obj)
        }
        Value::Sequence(seq) => {
            serde_json::Value::Array(seq.iter().map(yaml_to_json).collect())
        }
        Value::Value(scalar) => scalar_to_json(scalar),
        Value::Representation(repr, _, _) => serde_json::Value::String(repr.clone()),
        Value::Tagged(_, inner) => yaml_to_json(inner),
        Value::Alias(_) | Value::BadValue => serde_json::Value::Null,
    }
}

fn scalar_to_json(scalar: &ScalarOwned) -> serde_json::Value {
    match scalar {
        ScalarOwned::Null => serde_json::Value::Null,
        ScalarOwned::Boolean(b) => serde_json::Value::Bool(*b),
        ScalarOwned::Integer(i) => serde_json::Value::Number((*i).into()),
        ScalarOwned::FloatingPoint(f) => {
            let f = f.into_inner();
            serde_json::Number::from_f64(f)
                .map(serde_json::Value::Number)
                .unwrap_or(serde_json::Value::Null)
        }
        ScalarOwned::String(s) => serde_json::Value::String(s.clone()),
    }
}

fn yaml_key_to_string(yaml: &Value) -> Option<String> {
    match yaml {
        Value::Value(ScalarOwned::String(s)) => Some(s.clone()),
        Value::Value(ScalarOwned::Integer(i)) => Some(i.to_string()),
        Value::Value(ScalarOwned::Boolean(b)) => Some(b.to_string()),
        Value::Value(ScalarOwned::Null) => Some("null".to_string()),
        Value::Value(ScalarOwned::FloatingPoint(f)) => Some(f.to_string()),
        Value::Representation(repr, _, _) => Some(repr.clone()),
        _ => None,
    }
}

/// Parse a YAML string into a serde_json::Value.
pub fn parse_yaml(input: &str) -> Result<serde_json::Value, ParseError> {
    match Parser::parse_str(input)? {
        Some(yaml) => Ok(yaml_to_json(&yaml)),
        None => Ok(serde_json::Value::Null),
    }
}

/// Pre-loaded data cascade from `_data/` directories and `_data.yml` files.
///
/// Data is loaded per directory level. At lookup time, levels are merged
/// from root downward so that deeper directories override shallower ones.
pub struct DataCascade {
    /// Map from directory (relative to src_root) to data at that level.
    /// Key "" = root, "posts" = src/posts/, etc.
    levels: HashMap<PathBuf, serde_json::Map<String, serde_json::Value>>,
}

impl DataCascade {
    /// Walk `src_root` and load all `_data/` dirs and `_data.yml` files.
    pub fn load(src_root: &Path) -> io::Result<Self> {
        let mut levels = HashMap::new();
        load_level(src_root, src_root, &mut levels)?;
        Ok(Self { levels })
    }

    /// Return merged data for a file at `rel_path` (relative to src_root).
    ///
    /// Walks from root down to the file's parent, merging each level.
    pub fn data_for(&self, rel_path: &Path) -> serde_json::Map<String, serde_json::Value> {
        let mut result = serde_json::Map::new();

        // Start with root level
        if let Some(root_data) = self.levels.get(Path::new("")) {
            result.extend(root_data.clone());
        }

        // Walk through ancestor directories
        let parent = rel_path.parent().unwrap_or(Path::new(""));
        let mut current = PathBuf::new();
        for component in parent.components() {
            current.push(component);
            if let Some(level_data) = self.levels.get(&current) {
                result.extend(level_data.clone());
            }
        }

        result
    }
}

fn load_level(
    dir: &Path,
    src_root: &Path,
    levels: &mut HashMap<PathBuf, serde_json::Map<String, serde_json::Value>>,
) -> io::Result<()> {
    let rel_dir = dir.strip_prefix(src_root).unwrap_or(Path::new(""));
    let mut level_data = serde_json::Map::new();

    // Check for _data.yml
    let data_yml = dir.join("_data.yml");
    if data_yml.is_file() {
        let content = fs::read_to_string(&data_yml)?;
        if let Ok(serde_json::Value::Object(map)) = parse_yaml(&content) {
            level_data.extend(map);
        }
    }

    // Check for _data/ directory
    let data_dir = dir.join("_data");
    if data_dir.is_dir() {
        for entry in fs::read_dir(&data_dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.extension().is_some_and(|ext| ext == "yml" || ext == "yaml") && path.is_file()
            {
                let stem = path
                    .file_stem()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();
                let content = fs::read_to_string(&path)?;
                if let Ok(value) = parse_yaml(&content) {
                    level_data.insert(stem, value);
                }
            }
        }
    }

    if !level_data.is_empty() {
        levels.insert(rel_dir.to_path_buf(), level_data);
    }

    // Recurse into subdirectories (skip _ prefixed)
    let mut entries: Vec<_> = fs::read_dir(dir)?.collect::<Result<_, _>>()?;
    entries.sort_by_key(|e| e.file_name());

    for entry in entries {
        let path = entry.path();
        let name = entry.file_name();
        let name_str = name.to_string_lossy();

        if path.is_dir() && !name_str.starts_with('_') {
            load_level(&path, src_root, levels)?;
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU32, Ordering};

    static COUNTER: AtomicU32 = AtomicU32::new(0);

    fn temp_dir() -> PathBuf {
        let id = COUNTER.fetch_add(1, Ordering::Relaxed);
        let dir = std::env::temp_dir().join(format!("frey_data_test_{}_{id}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn yaml_to_json_scalars() {
        let yaml = Parser::parse_str("hello").unwrap().unwrap();
        assert_eq!(yaml_to_json(&yaml), serde_json::json!("hello"));

        let yaml = Parser::parse_str("42").unwrap().unwrap();
        assert_eq!(yaml_to_json(&yaml), serde_json::json!(42));

        let yaml = Parser::parse_str("true").unwrap().unwrap();
        assert_eq!(yaml_to_json(&yaml), serde_json::json!(true));

        let yaml = Parser::parse_str("null").unwrap().unwrap();
        assert_eq!(yaml_to_json(&yaml), serde_json::Value::Null);

        let yaml = Parser::parse_str("3.13").unwrap().unwrap();
        assert_eq!(yaml_to_json(&yaml), serde_json::json!(3.13));
    }

    #[test]
    fn yaml_to_json_sequence() {
        let yaml = Parser::parse_str("- one\n- 2\n- true").unwrap().unwrap();
        assert_eq!(yaml_to_json(&yaml), serde_json::json!(["one", 2, true]));
    }

    #[test]
    fn yaml_to_json_nested_map() {
        let yaml = Parser::parse_str("location:\n  city: Stockholm\n  country: Sweden")
            .unwrap()
            .unwrap();
        assert_eq!(
            yaml_to_json(&yaml),
            serde_json::json!({"location": {"city": "Stockholm", "country": "Sweden"}})
        );
    }

    #[test]
    fn parse_yaml_books_format() {
        let input = r#"
- title: The Lord of the Rings
  author: J.R.R. Tolkien
  finished: true
  stars: 4
- title: Animal Farm
  author: George Orwell
  finished: true
  stars: 4
"#;
        let result = parse_yaml(input).unwrap();
        let arr = result.as_array().unwrap();
        assert_eq!(arr.len(), 2);
        assert_eq!(arr[0]["title"], "The Lord of the Rings");
        assert_eq!(arr[0]["finished"], true);
        assert_eq!(arr[0]["stars"], 4);
    }

    #[test]
    fn cascade_load_and_merge() {
        let dir = temp_dir();

        // Root _data.yml
        fs::write(dir.join("_data.yml"), "layout: layouts/main.vto\n").unwrap();

        // Root _data/ directory
        fs::create_dir_all(dir.join("_data")).unwrap();
        fs::write(
            dir.join("_data/meta.yml"),
            "author: Johan\nsite: https://johan.im\n",
        )
        .unwrap();

        // Subdirectory with its own _data.yml
        fs::create_dir_all(dir.join("posts")).unwrap();
        fs::write(dir.join("posts/_data.yml"), "type: post\nlayout: layouts/post.vto\n").unwrap();

        let cascade = DataCascade::load(&dir).unwrap();

        // Root-level file should get root data only
        let data = cascade.data_for(Path::new("index.md"));
        assert_eq!(data["layout"], "layouts/main.vto");
        assert_eq!(data["meta"]["author"], "Johan");

        // Post should get root + posts data, with posts overriding
        let data = cascade.data_for(Path::new("posts/foo.md"));
        assert_eq!(data["layout"], "layouts/post.vto"); // overridden
        assert_eq!(data["type"], "post");
        assert_eq!(data["meta"]["author"], "Johan"); // inherited from root

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn cascade_deeper_overrides_shallower() {
        let dir = temp_dir();

        fs::write(dir.join("_data.yml"), "color: red\nfruit: apple\n").unwrap();
        fs::create_dir_all(dir.join("a/b")).unwrap();
        fs::write(dir.join("a/_data.yml"), "color: blue\n").unwrap();

        let cascade = DataCascade::load(&dir).unwrap();

        let data = cascade.data_for(Path::new("a/b/file.md"));
        assert_eq!(data["color"], "blue"); // overridden by a/
        assert_eq!(data["fruit"], "apple"); // inherited from root

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn cascade_data_dir_files() {
        let dir = temp_dir();

        fs::create_dir_all(dir.join("_data")).unwrap();
        fs::write(
            dir.join("_data/books.yml"),
            "- title: Book One\n- title: Book Two\n",
        )
        .unwrap();

        let cascade = DataCascade::load(&dir).unwrap();
        let data = cascade.data_for(Path::new("index.md"));

        let books = data["books"].as_array().unwrap();
        assert_eq!(books.len(), 2);
        assert_eq!(books[0]["title"], "Book One");

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn parse_yaml_empty() {
        let result = parse_yaml("").unwrap();
        assert_eq!(result, serde_json::Value::Null);
    }
}
