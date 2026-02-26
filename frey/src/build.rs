use owo_colors::OwoColorize;
use std::collections::BTreeSet;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::thread;
use std::time::Instant;

use crate::data::DataCascade;
use crate::templating::TemplateStore;

pub struct BuildConfig {
    pub src: String,
    pub dest: String,
    pub dry_run: bool,
    pub location: String,
}

enum WorkItem {
    Markdown {
        src: PathBuf,
        dest: PathBuf,
        rel_path: PathBuf,
    },
    Template {
        src: PathBuf,
        dest: PathBuf,
        rel_path: PathBuf,
    },
    Copy {
        src: PathBuf,
        dest: PathBuf,
    },
}

pub fn build(config: BuildConfig) -> io::Result<()> {
    let BuildConfig {
        src,
        dest,
        dry_run,
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

    // Print all items
    for item in &items {
        let (s, d) = match item {
            WorkItem::Markdown { src, dest, .. } => (src, dest),
            WorkItem::Template { src, dest, .. } => (src, dest),
            WorkItem::Copy { src, dest } => (src, dest),
        };
        print_file(s, d);
    }

    if !dry_run {
        // Phase 2: Create all output directories upfront
        let cascade = DataCascade::load(src)?;

        let dirs: BTreeSet<&Path> = items
            .iter()
            .filter_map(|item| {
                let d = match item {
                    WorkItem::Markdown { dest, .. } => dest,
                    WorkItem::Template { dest, .. } => dest,
                    WorkItem::Copy { dest, .. } => dest,
                };
                d.parent()
            })
            .collect();

        for dir in dirs {
            fs::create_dir_all(dir)?;
        }

        // Phase 3: Process in parallel
        let parallelism = thread::available_parallelism()
            .map(|n| n.get())
            .unwrap_or(4);

        println!("Using parallelism: {}", parallelism.green());

        let includes_dir = src.join("_includes");
        let template_store = TemplateStore::load(&includes_dir, location)?;

        let chunks: Vec<&[WorkItem]> = items.chunks(items.len().div_ceil(parallelism)).collect();

        thread::scope(|s| {
            let handles: Vec<_> = chunks
                .into_iter()
                .map(|chunk| {
                    let mut store = template_store.clone();
                    let cascade = &cascade;
                    s.spawn(move || -> io::Result<()> {
                        let opts = markdown::Options {
                            compile: markdown::CompileOptions {
                                allow_dangerous_html: true,
                                ..markdown::CompileOptions::gfm()
                            },
                            ..markdown::Options::gfm()
                        };
                        for item in chunk {
                            match item {
                                WorkItem::Markdown {
                                    src,
                                    dest,
                                    rel_path,
                                } => {
                                    process_markdown(
                                        src, dest, rel_path, &opts, cascade, &mut store,
                                    )?;
                                }
                                WorkItem::Template {
                                    src,
                                    dest,
                                    rel_path,
                                } => {
                                    process_template(src, dest, rel_path, cascade, &mut store)?;
                                }
                                WorkItem::Copy { src, dest } => {
                                    fs::copy(src, dest)?;
                                }
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
    }

    let elapsed = start.elapsed();
    let timing = format_duration(elapsed);

    if dry_run {
        println!(
            "Would build {count} files into {} in {timing}",
            dest.display().green()
        );
    } else {
        println!(
            "Built {count} files into {} in {timing}",
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
            let dest = output_path(&path, src_root, dest_root);
            items.push(WorkItem::Markdown {
                src: path,
                dest,
                rel_path,
            });
        } else if path.extension().is_some_and(|ext| ext == "vto") {
            let rel_path = path.strip_prefix(src_root).unwrap().to_path_buf();
            let dest = output_path(&path, src_root, dest_root);
            items.push(WorkItem::Template {
                src: path,
                dest,
                rel_path,
            });
        }
    }

    Ok(())
}

fn process_markdown(
    path: &Path,
    out_path: &Path,
    rel_path: &Path,
    options: &markdown::Options,
    cascade: &DataCascade,
    store: &mut TemplateStore,
) -> io::Result<()> {
    let content = fs::read_to_string(path)?;
    let (frontmatter, body) = split_frontmatter(&content);

    let fm_data = frontmatter.map(parse_frontmatter).unwrap_or_default();
    let mut data = cascade.data_for(rel_path);
    data.extend(fm_data);

    let html_body = markdown::to_html_with_options(body, options).expect("markdown parsing failed");

    let output = if data.contains_key("layout") {
        data.insert(
            "content".to_string(),
            serde_json::Value::String(html_body),
        );
        store
            .render_with_layout("{{ content }}", &data)
            .map_err(|e| io::Error::other(format!("{}: {e}", path.display())))?
    } else {
        html_body
    };

    fs::write(out_path, output)?;

    Ok(())
}

fn process_template(
    path: &Path,
    out_path: &Path,
    rel_path: &Path,
    cascade: &DataCascade,
    store: &mut TemplateStore,
) -> io::Result<()> {
    let content = fs::read_to_string(path)?;
    let (frontmatter, body) = split_frontmatter(&content);

    let fm_data = frontmatter.map(parse_frontmatter).unwrap_or_default();
    let mut data = cascade.data_for(rel_path);
    data.extend(fm_data);

    let result = store
        .render_with_layout(body, &data)
        .map_err(|e| io::Error::other(format!("{}: {e}", path.display())))?;

    fs::write(out_path, result)?;
    Ok(())
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

/// Compute the output path for a markdown file.
///
/// - `src/index.md` -> `build/index.html`
/// - `src/about.md` -> `build/about/index.html`
/// - `src/posts/foo.md` -> `build/posts/foo/index.html`
fn output_path(path: &Path, src_root: &Path, dest_root: &Path) -> PathBuf {
    let rel = path.strip_prefix(src_root).unwrap();
    let stem = rel.file_stem().unwrap().to_string_lossy();

    if stem == "index" {
        // index.md at any level -> index.html in same directory
        dest_root.join(rel.with_file_name("index.html"))
    } else {
        // about.md -> about/index.html
        let parent = rel.parent().unwrap_or(Path::new(""));
        dest_root
            .join(parent)
            .join(stem.as_ref())
            .join("index.html")
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

fn print_file(src: impl AsRef<Path>, dest: impl AsRef<Path>) {
    let (dir, rest) = dest
        .as_ref()
        .iter()
        .next()
        .map(|first| (first, dest.as_ref().strip_prefix(first).unwrap()))
        .unwrap();

    println!(
        "  {} -> {}/{}",
        src.as_ref().display(),
        Path::new(dir).display().dimmed(),
        rest.display().dimmed().bold()
    );
}
