# frey

In the `frey` directory, there's an empty rust project. My aim with "frey" is to build a static site generator for my personal site, which sits in the `src` dir. My current generator is called "Lume", and it is a 3rd party dependency built in Typescript (Deno runtime).

## Goals

- I want to learn more Rust.
- I want to deploy a single binary.
- I want few, lean dependencies.
- I want lightning fast builds.

## Features

I want to keep some features I like from Lume, but not all. In a nutshell:

frey must take source files from `src` and generate into `build`, and that artefact needs to be deployable as a static HTML site.

Lume works, as most static generators, with _content files_ and _data files_. A content file is often in Markdown (`.md`). A data file is often in YAML or JSON (`.yaml` and `.json`) or even Typescript `.ts`.

Lume puts its data files in either a `_data` directory or files named as `_data.$ext`. There's a cascade working, so that top level data files cascade down throughout the file hierarchy.

Further, Lume uses templating. I use a mix of Nunjucks (`.njk`) and Lume's own Vento (`.vto`) engine (I was in the process of migrating to Vento).

## Generating `src`

This is roughly how I want it:

**src -> build**

```
src/                build/
    index.md            index.html
    posts.njk           posts/index.html
    posts/
        foo.md          posts/foo/index.html
    status.json.njk     status.json
    public/*            *
```

Files or directories beginning with an underscore must _NOT_ be generated.

## Config

Lume uses a `_config.ts` file for config-as-code where I put things like source and destination dirs, website URL. But maybe there isn't that much to have in their, since Lume's config is mostly me configuring custom template helpers and some plugins I won't need in frey.

I reckon I need _some_ config, but haven't really landed on the solution. Some kind of DSL in Rust?

## CLI

frey should be a command line tool. Something like this:

```bash
frey build      # Build all
frey serve      # Serve on localhost:3000, rebuild on changes in src/
```

Use the `argh` crate for this.

## HTML Templating

I need _something_ to replace Nunjucks/Vento with. These are candidates:

- hypertext: https://github.com/vidhanio/hypertext
- tera: https://github.com/Keats/tera
- maud: https://maud.lambda.xyz
- askama: https://github.com/askama-rs/askama
- vy: https://github.com/jonahlund/vy
- handlebars: https://github.com/sunng87/handlebars-rust

I'm leaning towards Tera, because it's really close to Nunjucks in syntax and can easily load static file templates.

(Idea:)

What would be really cool thought would be to use Rhai (https://github.com/rhaiscript/rhai) as a scripting language embedded in the templates. This would mean no Rust code would need to be touched when doing template development (for logic in helpers, etc).

## External dependencies

I generally lean towards homerolling functions and sacrificing fanciness over pulling in an external dependency. But these are things I reckon we need:

- Markdown (maybe https://github.com/wooorm/markdown-rs).
- Templating (see other section).
- Minifying CSS/HTML (maybe https://docs.rs/lightningcss/latest/lightningcss/).
