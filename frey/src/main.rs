mod build;
mod data;
mod eda;
mod templating;

use argh::FromArgs;
use owo_colors::OwoColorize;

use crate::build::BuildConfig;

/// Johan's personal static site generator.
#[derive(FromArgs)]
struct Frey {
    #[argh(subcommand)]
    command: Command,
}

#[derive(FromArgs)]
#[argh(subcommand)]
enum Command {
    Build(Build),
}

/// Build the site from source files.
#[derive(FromArgs)]
#[argh(subcommand, name = "build")]
struct Build {
    /// source directory (default: src)
    #[argh(option, default = "String::from(\"src\")")]
    src: String,

    /// destination directory (default: build)
    #[argh(option, default = "String::from(\"build\")")]
    dest: String,

    /// show what would be generated without writing files
    #[argh(switch)]
    dry_run: bool,

    /// site URL for absolute links (default: http://localhost:3000)
    #[argh(option, default = "String::from(\"http://localhost:3000\")")]
    location: String,
}

fn main() {
    let args: Frey = argh::from_env();

    match args.command {
        Command::Build(cmd) => {
            if let Err(e) = build::build(cmd.into()) {
                eprintln!("{} {e}", "ERROR".red());
                std::process::exit(1);
            }
        }
    }
}

impl From<Build> for BuildConfig {
    fn from(
        Build {
            src,
            dest,
            dry_run,
            location,
        }: Build,
    ) -> Self {
        BuildConfig {
            src,
            dest,
            dry_run,
            location,
        }
    }
}
