use owo_colors::OwoColorize;
use std::fs;
use std::io::{self, Write as _};
use std::path::{Path, PathBuf};

use std::thread;
use std::time::Instant;

use crate::data::DataCascade;
use crate::page::{File, Page};
use crate::templating::TemplateStore;

pub struct BuildConfig {
    pub src: String,
    pub dest: String,
    pub dry_run: bool,
    pub verbose: bool,
    pub location: String,
}

enum WorkItem {
    Process { src: PathBuf, kind: Processable },
    Copy { src: PathBuf, dest: PathBuf },
}

enum Processable {
    Markdown,
    Vto,
    Simple,
}

impl Processable {
    fn from_extension(s: &str) -> Self {
        match s {
            "md" => Self::Markdown,
            "vto" => Self::Vto,
            _ => Self::Simple,
        }
    }
}

/// A resolved build operation ready to be executed.
enum Operation {
    /// Write a rendered page.
    WritePage(Page),
    /// Write content to a destination path (simple files with frontmatter stripped).
    Write { src: PathBuf, dest: PathBuf, content: String },
    /// Copy a file from src to dest.
    Copy { src: PathBuf, dest: PathBuf },
    /// Skip a file (url: false, draft, etc).
    Skip { src: PathBuf, reason: &'static str },
}

impl Operation {
    fn format_line(&self, dest_root: &Path) -> String {
        match self {
            Operation::WritePage(page) => {
                let src = &page.file.src;
                let full_dest = dest_root.join(&page.file.dest);

                let (dir, rest) = split_dest_path(&full_dest);

                format!(
                    "  {} -> {}/{}",
                    src.display(),
                    Path::new(&dir).display().dimmed(),
                    rest.display().dimmed().bold()
                )
            }
            Operation::Write { src, dest, .. } | Operation::Copy { src, dest } => {
                let (dir, rest) = split_dest_path(dest);

                format!(
                    "  {} -> {}/{}",
                    src.display(),
                    Path::new(&dir).display().dimmed(),
                    rest.display().dimmed().bold()
                )
            }
            Operation::Skip { src, reason } => {
                format!(
                    "  {} {} ({})",
                    src.display(),
                    " SKIP ".black().on_truecolor(255, 223, 112),
                    reason.dimmed(),
                )
            }
        }
    }

    fn print(&self, verbose: bool, dest_root: &Path) {
        let line = self.format_line(dest_root);
        if verbose {
            println!("{line}");
        } else {
            print!("\r\x1b[2K{line}");
            let _ = io::stdout().flush();
        }
    }

    fn execute(&self, dest_root: &Path) -> io::Result<()> {
        match self {
            Operation::WritePage(page) => {
                let dest = dest_root.join(&page.file.dest);
                ensure_parent(&dest)?;
                fs::write(dest, &page.rendered)
            }
            Operation::Write { dest, content, .. } => {
                ensure_parent(dest)?;
                fs::write(dest, content)
            }
            Operation::Copy { src, dest } => {
                ensure_parent(dest)?;
                fs::copy(src, dest)?;
                Ok(())
            }
            Operation::Skip { .. } => Ok(()),
        }
    }
}

fn ensure_parent(path: &Path) -> io::Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    Ok(())
}

fn split_dest_path(path: &Path) -> (std::ffi::OsString, PathBuf) {
    let first = path.iter().next().unwrap();
    (
        first.to_owned(),
        path.strip_prefix(first).unwrap().to_owned(),
    )
}

pub fn build(config: BuildConfig) -> io::Result<()> {
    let BuildConfig {
        src,
        dest,
        dry_run,
        verbose,
        location,
    } = config;
    let src_dir = Path::new(&src);
    let dest = Path::new(&dest);

    if !src_dir.exists() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            format!("Source directory not found: {}", src_dir.display()),
        ));
    }

    if !dry_run {
        fs::create_dir_all(dest)?;
    }

    let start = Instant::now();

    // Phase 1: Collect work items
    let mut items = Vec::new();
    walk(src_dir, src_dir, dest, &mut items)?;

    let count = items.len();

    let cascade = DataCascade::load(src_dir)?;

    // Phase 2: Process in parallel
    let parallelism = thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4);

    if verbose {
        println!("Using parallelism: {}", parallelism.green());
    }

    let includes_dir = src_dir.join("_includes");
    let template_store = TemplateStore::load(&includes_dir, location)?;

    let chunks: Vec<&[WorkItem]> = items.chunks(items.len().div_ceil(parallelism)).collect();

    thread::scope(|s| {
        let handles: Vec<_> = chunks
            .into_iter()
            .map(|chunk| {
                let mut store = template_store.clone();
                let cascade = &cascade;
                let dest = &dest;
                s.spawn(move || -> io::Result<()> {
                    for item in chunk {
                        let op = match item {
                            WorkItem::Process { src, kind: Processable::Simple } => {
                                let content = fs::read_to_string(src)?;
                                let (_fm, body) = split_frontmatter(&content);
                                let rel_path = src.strip_prefix(src_dir).unwrap();
                                Operation::Write {
                                    src: src.clone(),
                                    dest: dest.join(rel_path),
                                    content: body.to_string(),
                                }
                            }

                            WorkItem::Process { src, kind } => {
                                let content = fs::read_to_string(src)?;
                                let mut file = prepare_file(src_dir, src, &content, cascade);

                                if file.draft {
                                    Operation::Skip {
                                        src: file.src,
                                        reason: "draft",
                                    }
                                } else if !file.resolve_url() {
                                    Operation::Skip {
                                        src: file.src,
                                        reason: "url: false",
                                    }
                                } else {
                                    match kind {
                                        Processable::Vto => process_template(file, &mut store)?,
                                        Processable::Markdown => {
                                            process_markdown(file, &mut store)?
                                        }
                                        Processable::Simple => unreachable!(),
                                    }
                                }
                            }

                            WorkItem::Copy { src, dest } => Operation::Copy {
                                src: src.clone(),
                                dest: dest.clone(),
                            },
                        };

                        op.print(verbose, dest);
                        if !dry_run {
                            op.execute(dest)?;
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
        } else if let Some(ext) = path.extension().and_then(|ext| ext.to_str()) {
            let kind = Processable::from_extension(ext);
            items.push(WorkItem::Process { src: path, kind });
        }
    }

    Ok(())
}

/// Read a content file, merge cascade + frontmatter, construct a File,
/// check for draft/url:false skips, and resolve the output path.
/// Returns `Err` on IO failure, `Ok(Err(Skip))` if the page should be skipped,
/// or `Ok(Ok(file))` with a fully resolved File.
fn prepare_file(src_dir: &Path, path: &Path, content: &str, cascade: &DataCascade) -> File {
    let (frontmatter, body) = split_frontmatter(content);

    let rel_path = File::to_relative_path(src_dir, path);

    let fm_data = frontmatter.map(parse_frontmatter).unwrap_or_default();
    let cascade_data = cascade.data_for(&rel_path);
    let mut data = cascade_data.values;
    let js_sources = cascade_data.js_sources;
    data.extend(fm_data);

    File::new(
        src_dir,
        path.to_path_buf(),
        body.to_string(),
        data,
        js_sources,
    )
}

fn process_markdown(mut file: File, store: &mut TemplateStore) -> io::Result<Operation> {
    let html_body = markdown::to_html_with_options(
        &file.body,
        &markdown::Options {
            compile: markdown::CompileOptions {
                allow_dangerous_html: true,
                ..markdown::CompileOptions::gfm()
            },
            ..markdown::Options::gfm()
        },
    )
    .expect("markdown parsing failed");

    let rendered = if file.layout.is_some() {
        file.data
            .insert("content".to_string(), serde_json::Value::String(html_body));
        store
            .render_with_layout("{{ content }}", &file.data, &file.js_sources)
            .map_err(|e| io::Error::other(format!("{}: {e}", file.src.display())))?
    } else {
        html_body
    };

    Ok(Operation::WritePage(Page { file, rendered }))
}

fn process_template(file: File, store: &mut TemplateStore) -> io::Result<Operation> {
    let rendered = store
        .render_with_layout(&file.body, &file.data, &file.js_sources)
        .map_err(|e| io::Error::other(format!("{}: {e}", file.src.display())))?;

    Ok(Operation::WritePage(Page { file, rendered }))
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
    fn split_frontmatter_basic() {
        let (fm, body) = split_frontmatter("---\ntitle: Hello\n---\nBody here");
        assert_eq!(fm, Some("title: Hello"));
        assert_eq!(body, "Body here");
    }

    #[test]
    fn split_frontmatter_none() {
        let (fm, body) = split_frontmatter("No frontmatter here");
        assert!(fm.is_none());
        assert_eq!(body, "No frontmatter here");
    }
}
