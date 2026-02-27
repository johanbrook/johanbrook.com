use owo_colors::OwoColorize;
use std::fmt;
use std::fs;
use std::io::{self, Write as _};
use std::path::{Path, PathBuf};
use std::thread;
use std::time::Instant;

use crate::data::DataCascade;
use crate::page::Page;
use crate::templating::TemplateStore;

pub struct BuildConfig {
    pub src: String,
    pub dest: String,
    pub dry_run: bool,
    pub verbose: bool,
    pub location: String,
}

enum WorkItem {
    Markdown { src: PathBuf, rel_path: PathBuf },
    Template { src: PathBuf, rel_path: PathBuf },
    Copy { src: PathBuf, dest: PathBuf },
}

/// A resolved build operation ready to be executed.
enum Operation {
    /// Write rendered content to a path.
    Write {
        src: PathBuf,
        dest: PathBuf,
        content: String,
    },
    /// Copy a file from src to dest.
    Copy { src: PathBuf, dest: PathBuf },
    /// Skip a file (url: false, draft, etc).
    Skip { src: PathBuf, reason: &'static str },
}

impl fmt::Display for Operation {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Operation::Write { src, dest, .. } | Operation::Copy { src, dest } => {
                let (dir, rest) = dest
                    .iter()
                    .next()
                    .map(|first| (first, dest.strip_prefix(first).unwrap()))
                    .unwrap();
                write!(
                    f,
                    "  {} -> {}/{}",
                    src.display(),
                    Path::new(dir).display().dimmed(),
                    rest.display().dimmed().bold()
                )
            }
            Operation::Skip { src, reason } => {
                write!(
                    f,
                    "  {} {} ({})",
                    src.display(),
                    " SKIP ".black().on_truecolor(255, 223, 112),
                    reason
                )
            }
        }
    }
}

impl Operation {
    fn print(&self, verbose: bool) {
        if verbose {
            match self {
                Operation::Write { src, dest, .. } | Operation::Copy { src, dest } => {
                    let (dir, rest) = dest
                        .iter()
                        .next()
                        .map(|first| (first, dest.strip_prefix(first).unwrap()))
                        .unwrap();
                    println!(
                        "  {} -> {}/{}",
                        src.display(),
                        Path::new(dir).display().dimmed(),
                        rest.display().dimmed().bold()
                    );
                }
                Operation::Skip { src, reason } => {
                    println!(
                        "  {} {} ({})",
                        src.display(),
                        " SKIP ".black().on_truecolor(255, 223, 112),
                        reason.dimmed(),
                    );
                }
            }
        } else {
            print!("\r\x1b[2K{}", self);
            let _ = io::stdout().flush();
        }
    }

    fn execute(&self) -> io::Result<()> {
        match self {
            Operation::Write { dest, content, .. } => {
                if let Some(parent) = dest.parent() {
                    fs::create_dir_all(parent)?;
                }
                fs::write(dest, content)
            }
            Operation::Copy { src, dest } => {
                if let Some(parent) = dest.parent() {
                    fs::create_dir_all(parent)?;
                }
                fs::copy(src, dest)?;
                Ok(())
            }
            Operation::Skip { .. } => Ok(()),
        }
    }
}

pub fn build(config: BuildConfig) -> io::Result<()> {
    let BuildConfig {
        src,
        dest,
        dry_run,
        verbose,
        location,
    } = config;
    let src = Path::new(&src);
    let dest = Path::new(&dest);

    if !src.exists() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            format!("Source directory not found: {}", src.display()),
        ));
    }

    if !dry_run {
        fs::create_dir_all(dest)?;
    }

    let start = Instant::now();

    // Phase 1: Collect work items
    let mut items = Vec::new();
    walk(src, src, dest, &mut items)?;

    let count = items.len();

    let cascade = DataCascade::load(src)?;

    // Phase 2: Process in parallel
    let parallelism = thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4);

    if verbose {
        println!("Using parallelism: {}", parallelism.green());
    }

    let includes_dir = src.join("_includes");
    let template_store = TemplateStore::load(&includes_dir, location)?;
    let src_str = src.to_string_lossy().into_owned();

    let chunks: Vec<&[WorkItem]> = items.chunks(items.len().div_ceil(parallelism)).collect();

    thread::scope(|s| {
        let handles: Vec<_> = chunks
            .into_iter()
            .map(|chunk| {
                let mut store = template_store.clone();
                let cascade = &cascade;
                let src_str = &src_str;
                let dest = &dest;
                s.spawn(move || -> io::Result<()> {
                    let opts = markdown::Options {
                        compile: markdown::CompileOptions {
                            allow_dangerous_html: true,
                            ..markdown::CompileOptions::gfm()
                        },
                        ..markdown::Options::gfm()
                    };
                    for item in chunk {
                        let op = match item {
                            WorkItem::Markdown { src, rel_path } => process_markdown(
                                src, rel_path, dest, src_str, &opts, cascade, &mut store,
                            )?,
                            WorkItem::Template { src, rel_path } => {
                                process_template(src, rel_path, dest, src_str, cascade, &mut store)?
                            }
                            WorkItem::Copy { src, dest } => Operation::Copy {
                                src: src.clone(),
                                dest: dest.clone(),
                            },
                        };

                        op.print(verbose);
                        if !dry_run {
                            op.execute()?;
                        }
                    }
                    Ok(())
                })
            })
            .collect();

        for handle in handles {
            handle.join().expect("thread panicked")?;
        }

        Ok::<(), io::Error>(())
    })?;

    // Clear the flickering line before printing the summary
    if !verbose {
        print!("\r\x1b[2K");
        let _ = io::stdout().flush();
    }

    let elapsed = start.elapsed();
    let timing = format_duration(elapsed);

    if dry_run {
        println!("Processed {count} files in {timing} (dry run, nothing written)",);
    } else {
        println!(
            "Processed {count} files into {} in {timing}",
            dest.display().green()
        );
    }
    Ok(())
}

fn walk(
    dir: &Path,
    src_root: &Path,
    dest_root: &Path,
    items: &mut Vec<WorkItem>,
) -> io::Result<()> {
    let mut entries: Vec<_> = fs::read_dir(dir)?.collect::<Result<_, _>>()?;
    entries.sort_by_key(|e| e.file_name());

    for entry in entries {
        let path = entry.path();
        let name = entry.file_name();
        let name_str = name.to_string_lossy();

        // Skip underscore-prefixed files and directories
        if name_str.starts_with('_') {
            continue;
        }

        if path.is_dir() {
            // Handle public/ directory: copy contents to dest root
            if path == src_root.join("public") {
                collect_copies(&path, dest_root, items)?;
                continue;
            }

            walk(&path, src_root, dest_root, items)?;
        } else if path.extension().is_some_and(|ext| ext == "md") {
            let rel_path = path.strip_prefix(src_root).unwrap().to_path_buf();
            items.push(WorkItem::Markdown {
                src: path,
                rel_path,
            });
        } else if path.extension().is_some_and(|ext| ext == "vto") {
            let rel_path = path.strip_prefix(src_root).unwrap().to_path_buf();
            items.push(WorkItem::Template {
                src: path,
                rel_path,
            });
        }
    }

    Ok(())
}

/// Resolve the url value from merged data, checking both static values and JS functions.
fn resolve_url(
    data: &serde_json::Map<String, serde_json::Value>,
    js_sources: &[String],
    rel_path: &Path,
    src_str: &str,
) -> Option<serde_json::Value> {
    // First check if url is already a string or false in the data
    if let Some(url_val) = data.get("url") {
        match url_val {
            serde_json::Value::String(_) | serde_json::Value::Bool(false) => {
                return Some(url_val.clone());
            }
            _ => {}
        }
    }

    // Try calling a JS url function if js_sources are present
    if !js_sources.is_empty() {
        let page = Page::build(rel_path, data.clone(), src_str);
        let page_json = serde_json::to_string(&page).unwrap_or_default();
        match crate::eda::call_js_function(js_sources, "url", &page_json) {
            Ok(Some(val)) => return Some(val),
            Ok(None) => {}
            Err(e) => {
                eprintln!(
                    "Warning: url function failed for {}: {e}",
                    rel_path.display()
                );
            }
        }
    }

    None
}

/// Resolve the final output path for a page, given its url value.
///
/// - `None` url → fall back to default pretty-URL logic
/// - `Some(Bool(false))` → skip the page (return `None`)
/// - `Some(String(s))` → convert URL string to filesystem path
fn resolve_output_path(
    url: Option<&serde_json::Value>,
    rel_path: &Path,
    dest_root: &Path,
) -> Option<PathBuf> {
    match url {
        Some(serde_json::Value::Bool(false)) => None,
        Some(serde_json::Value::String(s)) => {
            let s = s.trim_start_matches('/');
            if s.is_empty() {
                Some(dest_root.join("index.html"))
            } else if s.ends_with('/') {
                Some(dest_root.join(s).join("index.html"))
            } else if Path::new(s).extension().is_some() {
                Some(dest_root.join(s))
            } else {
                // No trailing slash, no extension → output as file
                Some(dest_root.join(s))
            }
        }
        _ => Some(default_output_path(rel_path, dest_root)),
    }
}

/// Derive a URL string from an output path, relative to the dest root.
/// e.g. `build/posts/foo/index.html` → `/posts/foo/`
///      `build/feed.xml` → `/feed.xml`
fn output_path_to_url(out_path: &Path, dest_root: &Path) -> String {
    let rel = out_path.strip_prefix(dest_root).unwrap_or(out_path);
    let s = rel.to_string_lossy();
    if s.ends_with("/index.html") {
        format!("/{}", s.strip_suffix("index.html").unwrap())
    } else if s == "index.html" {
        "/".to_string()
    } else {
        format!("/{s}")
    }
}

/// Default pretty-URL output path from filesystem structure.
///
/// - `index.md` -> `build/index.html`
/// - `about.md` -> `build/about/index.html`
/// - `posts/foo.md` -> `build/posts/foo/index.html`
fn default_output_path(rel_path: &Path, dest_root: &Path) -> PathBuf {
    let stem = rel_path.file_stem().unwrap().to_string_lossy();

    if stem == "index" {
        dest_root.join(rel_path.with_file_name("index.html"))
    } else {
        let parent = rel_path.parent().unwrap_or(Path::new(""));
        dest_root
            .join(parent)
            .join(stem.as_ref())
            .join("index.html")
    }
}

/// Prepared page data after merging cascade + frontmatter, resolving url, and checking for skips.
struct Prepared<'a> {
    body: &'a str,
    dest: PathBuf,
    data: serde_json::Map<String, serde_json::Value>,
    js_sources: Vec<String>,
}

/// Read a content file, merge cascade + frontmatter, check for draft/url:false skips,
/// and resolve the output path. Returns `Err` on IO failure, `Ok(Skip)` if the page
/// should be skipped, or the prepared data for rendering.
fn prepare<'a>(
    path: &Path,
    content: &'a str,
    rel_path: &Path,
    dest_root: &Path,
    src_str: &str,
    cascade: &DataCascade,
) -> io::Result<Result<Prepared<'a>, Operation>> {
    let (frontmatter, body) = split_frontmatter(content);

    let fm_data = frontmatter.map(parse_frontmatter).unwrap_or_default();
    let cascade_data = cascade.data_for(rel_path);
    let mut data = cascade_data.values;
    let js_sources = cascade_data.js_sources;
    data.extend(fm_data);

    if data.get("draft").and_then(|v| v.as_bool()) == Some(true) {
        return Ok(Err(Operation::Skip {
            src: path.to_path_buf(),
            reason: "draft",
        }));
    }

    let url_val = resolve_url(&data, &js_sources, rel_path, src_str);
    let dest = match resolve_output_path(url_val.as_ref(), rel_path, dest_root) {
        Some(p) => p,
        None => {
            return Ok(Err(Operation::Skip {
                src: path.to_path_buf(),
                reason: "url: false",
            }));
        }
    };

    if let Some(val) = &url_val {
        data.insert("url".to_string(), val.clone());
    } else if !data.contains_key("url") {
        let url_str = output_path_to_url(&dest, dest_root);
        data.insert("url".to_string(), serde_json::Value::String(url_str));
    }

    Ok(Ok(Prepared {
        body,
        dest,
        data,
        js_sources,
    }))
}

fn process_markdown(
    path: &Path,
    rel_path: &Path,
    dest_root: &Path,
    src_str: &str,
    options: &markdown::Options,
    cascade: &DataCascade,
    store: &mut TemplateStore,
) -> io::Result<Operation> {
    let content = fs::read_to_string(path)?;
    let Prepared {
        body,
        dest,
        mut data,
        js_sources,
    } = match prepare(path, &content, rel_path, dest_root, src_str, cascade)? {
        Ok(p) => p,
        Err(skip) => return Ok(skip),
    };

    let html_body = markdown::to_html_with_options(body, options).expect("markdown parsing failed");

    let rendered = if data.contains_key("layout") {
        data.insert("content".to_string(), serde_json::Value::String(html_body));
        store
            .render_with_layout("{{ content }}", &data, &js_sources)
            .map_err(|e| io::Error::other(format!("{}: {e}", path.display())))?
    } else {
        html_body
    };

    Ok(Operation::Write {
        src: path.to_path_buf(),
        dest,
        content: rendered,
    })
}

fn process_template(
    path: &Path,
    rel_path: &Path,
    dest_root: &Path,
    src_str: &str,
    cascade: &DataCascade,
    store: &mut TemplateStore,
) -> io::Result<Operation> {
    let content = fs::read_to_string(path)?;
    let Prepared {
        body,
        dest,
        data,
        js_sources,
    } = match prepare(path, &content, rel_path, dest_root, src_str, cascade)? {
        Ok(p) => p,
        Err(skip) => return Ok(skip),
    };

    let rendered = store
        .render_with_layout(body, &data, &js_sources)
        .map_err(|e| io::Error::other(format!("{}: {e}", path.display())))?;

    Ok(Operation::Write {
        src: path.to_path_buf(),
        dest,
        content: rendered,
    })
}

/// Split frontmatter (between `---` delimiters) from the body.
/// Returns (Option<frontmatter_str>, body_str).
pub(crate) fn split_frontmatter(content: &str) -> (Option<&str>, &str) {
    let trimmed = content.trim_start();

    if !trimmed.starts_with("---") {
        return (None, content);
    }

    // Find the end of the opening ---
    let after_first = &trimmed[3..];
    let after_first = after_first.trim_start_matches([' ', '\t']);
    if !after_first.starts_with('\n') && !after_first.starts_with("\r\n") {
        return (None, content);
    }

    let rest = after_first.trim_start_matches(['\n', '\r']);

    if let Some(end) = rest.find("\n---") {
        let fm = &rest[..end];
        let body_start = end + 4; // skip \n---
        let body = rest[body_start..].trim_start_matches(['-', ' ', '\t', '\n', '\r']);
        (Some(fm), body)
    } else {
        (None, content)
    }
}

/// Parse YAML frontmatter into a JSON map.
pub(crate) fn parse_frontmatter(fm: &str) -> serde_json::Map<String, serde_json::Value> {
    match crate::data::parse_yaml(fm) {
        Ok(serde_json::Value::Object(map)) => map,
        _ => serde_json::Map::new(),
    }
}

/// Recursively collect file copy work items from a directory.
fn collect_copies(src: &Path, dest: &Path, items: &mut Vec<WorkItem>) -> io::Result<()> {
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let path = entry.path();
        let name = entry.file_name();
        let target = dest.join(&name);

        if path.is_dir() {
            collect_copies(&path, &target, items)?;
        } else {
            items.push(WorkItem::Copy {
                src: path,
                dest: target,
            });
        }
    }

    Ok(())
}

fn format_duration(d: std::time::Duration) -> String {
    let ms = d.as_millis();
    if ms < 1000 {
        format!("{ms}ms")
    } else {
        format!("{:.2}s", d.as_secs_f64())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolve_output_path_with_string_url() {
        let dest = Path::new("build");

        // Trailing slash → append index.html
        let url = serde_json::Value::String("/writings/my-post/".to_string());
        assert_eq!(
            resolve_output_path(Some(&url), Path::new("posts/foo.md"), dest),
            Some(PathBuf::from("build/writings/my-post/index.html"))
        );

        // With extension → use as-is
        let url = serde_json::Value::String("/feed.xml".to_string());
        assert_eq!(
            resolve_output_path(Some(&url), Path::new("feed.vto"), dest),
            Some(PathBuf::from("build/feed.xml"))
        );

        // No trailing slash, no extension → output as file
        let url = serde_json::Value::String("/CNAME".to_string());
        assert_eq!(
            resolve_output_path(Some(&url), Path::new("cname.md"), dest),
            Some(PathBuf::from("build/CNAME"))
        );

        // Root path
        let url = serde_json::Value::String("/".to_string());
        assert_eq!(
            resolve_output_path(Some(&url), Path::new("index.md"), dest),
            Some(PathBuf::from("build/index.html"))
        );
    }

    #[test]
    fn resolve_output_path_with_false() {
        let url = serde_json::Value::Bool(false);
        assert_eq!(
            resolve_output_path(Some(&url), Path::new("draft.md"), Path::new("build")),
            None
        );
    }

    #[test]
    fn resolve_output_path_with_none() {
        // Falls back to default pretty-URL logic
        assert_eq!(
            resolve_output_path(None, Path::new("about.md"), Path::new("build")),
            Some(PathBuf::from("build/about/index.html"))
        );
        assert_eq!(
            resolve_output_path(None, Path::new("index.md"), Path::new("build")),
            Some(PathBuf::from("build/index.html"))
        );
        assert_eq!(
            resolve_output_path(None, Path::new("posts/foo.md"), Path::new("build")),
            Some(PathBuf::from("build/posts/foo/index.html"))
        );
    }
}
