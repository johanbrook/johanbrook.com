---
title: Colophon
subtitle: What tech & tools I use.
layout: layouts/page.njk
date: Git Last Modified
templateEngine: md,njk
tags:
    - tools
---

# Tools

## Tech

- **Text editor:** [Zed](http://zed.dev)
- **Operating system:** macOS
- **Messaging apps:** Signal, if I get to pick
- **Music app:** Spotify
- **Coding font:** JetBrains Mono
- **Mail provider:** [Fastmail](http://fastmail.com)
- **Notes:** Apple Notes
- **Terminal:** Apple Terminal
- **Web browser:** Apple Safari
- **Phone:** Apple iPhone 12 mini
- **Scripting language:** Javascript (Typescript in [Deno](http://deno.com))
- **E-book reader:** [Kobo Clara 2E](/micro/20240219203953/).

## News

- [Dagens Nyheter](http://dn.se)
- [The Guardian](http://theguardian.co.uk)
- [Lobsters](http://lobste.rs)

# This site

## Architecture

- This site is generated with the [Lume](https://github.com/lumeland/lume) static site generator initially built by [Oscar Otero](https://github.com/oscarotero). The source code of this site is [available on GitHub](https://github.com/johanbrook/johanbrook.com).
- I use font stacks from [Modern Font Stacks](https://modernfontstacks.com). It'll use whatever sans-serifs and serifs you've got installed on your device.
- It's hosted on Github Pages.
- It's using GitHub Actions to build and deploy.

## History

I've run this site in some shape or form since 2010.

I started out with a Wordpress.com site with a custom domain ("johanbrook.com"). When my urge for doing custom web dev took over, I moved to a self-hosted Wordpress installation. That was a nice learning experience, but after I got hacked, I was fed up with MySQL and PHP and moved to Jekyll.

I grabbed Jekyll because it was one of the few static site generators around, but it was also the most popular one. I was kinda into Ruby at the time, so that was cool too. I grabbed some script online which helped me figure out how to export and convert all my Wordpress content into suitable `.md` files for Jekyll. This was where I also moved to GitHub Pages, because, it was also one of the few free and good static hosting providers around. I've been on GH Pages ever since.

Some time went by, and the _itch_ we all get with our personal sites striked again! In a redesign, I moved to using Metalsmith as the generator. Metalsmith was NodeJS based, which I seemed to have preferred. It was lean and more actively updated than Jekyll, which was seemingly considered "done" by its author.

But even Metalsmith became abandonware. I'm sure it still _works_, but I moved on to Eleventy. It had some architectural decisions I liked over Metalsmith, and its data model was simpler.

_Here we go again…_ I moved to Lume some year ago. I was (and still am!) very excited for Deno, which is like NodeJS but without all the bad decisions. I don't get annoyed when developing in Deno, and I'm using every excuse to do scripting with it.

That's where we are today!
