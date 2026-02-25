use owo_colors::OwoColorize;
use std::collections::BTreeSet;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::thread;
use std::time::Instant;

pub struct BuildConfig {
    pub src: String,
    pub dest: String,
    pub dry_run: bool,
}

enum WorkItem {
    Markdown { src: PathBuf, dest: PathBuf },
    Copy { src: PathBuf, dest: PathBuf },
}

pub fn build(config: BuildConfig) -> io::Result<()> {
    let BuildConfig { src, dest, dry_run } = config;
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
            WorkItem::Markdown { src, dest } => (src, dest),
            WorkItem::Copy { src, dest } => (src, dest),
        };
        print_file(s, d);
    }

    if !dry_run {
        // Phase 2: Create all output directories upfront
        let dirs: BTreeSet<&Path> = items
            .iter()
            .filter_map(|item| {
                let d = match item {
                    WorkItem::Markdown { dest, .. } => dest,
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

        let chunks: Vec<&[WorkItem]> = items.chunks(items.len().div_ceil(parallelism)).collect();

        thread::scope(|s| {
            let handles: Vec<_> = chunks
                .into_iter()
                .map(|chunk| {
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
                                WorkItem::Markdown { src, dest } => {
                                    process_markdown(src, dest, &opts)?;
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
            let dest = output_path(&path, src_root, dest_root);
            items.push(WorkItem::Markdown { src: path, dest });
        }
        // Skip all other file types for now (.njk, .ts, .vto, .css, etc.)
    }

    Ok(())
}

fn process_markdown(path: &Path, out_path: &Path, options: &markdown::Options) -> io::Result<()> {
    let content = fs::read_to_string(path)?;
    let (frontmatter, body) = split_frontmatter(&content);

    let title = frontmatter.and_then(extract_title);

    let html_body = markdown::to_html_with_options(body, options).expect("markdown parsing failed");

    let title_str = title.unwrap_or_default();
    let html = format!(
        "<!DOCTYPE html>\n\
         <html lang=\"en\">\n\
         <head>\n\
         <meta charset=\"utf-8\">\n\
         <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n\
         <title>{title_str}</title>\n\
         </head>\n\
         <body>\n\
         {html_body}\n\
         </body>\n\
         </html>\n"
    );

    fs::write(out_path, html)?;

    Ok(())
}

/// Split frontmatter (between `---` delimiters) from the markdown body.
/// Returns (Option<frontmatter_str>, body_str).
fn split_frontmatter(content: &str) -> (Option<&str>, &str) {
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

/// Extract a `title:` value from YAML frontmatter (simple line-based parsing).
fn extract_title(frontmatter: &str) -> Option<String> {
    for line in frontmatter.lines() {
        let line = line.trim();
        if let Some(rest) = line.strip_prefix("title:") {
            let title = rest.trim();
            // Strip surrounding quotes if present
            let title = title
                .strip_prefix('"')
                .and_then(|t| t.strip_suffix('"'))
                .or_else(|| title.strip_prefix('\'').and_then(|t| t.strip_suffix('\'')))
                .unwrap_or(title);
            if !title.is_empty() {
                return Some(title.to_string());
            }
        }
    }
    None
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
