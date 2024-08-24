---
title: Building a simple blog
slug: simple-blog
date: 2024-08-21T20:09:45+02:00
location: Stockholm, Sweden
timezone: Europe/Stockholm
excerpt: <excerpt>
draft: true
tags:
    - dev
---

I've just finished tinkering with a simple blog for me and my girlfriend to have when travelling to South Africa for six months this year. We'd like it as a travel blog, and will hopefully keep using it for future trips too.

This post is how I landed on building it myself and what the alternatives were.

## Alternatives

I did some light research for _free_ blog engines with a custom domain. My requirements were:

-   A UI, since I can't expect my girlfriend to fire up a code editor to write things.
-   Some kind of media management, since said girlfriend will want to upload photos to attach to posts.
-   Free: sorry to say, but I don't want to pay for a blog with such humble requirements as we have.
-   Custom domain support, since we're vain millennials snowflakes.

I checked out these blog services:

-   **Tumblr**. You have to pay for custom domains.
-   **Ghost**. You have to pay.
-   **Wordpress.com**. You have to pay.

Right about there, I lost interest, and decided to pursue the only sane and respectable solution: **to build it myself.**

## Picking engine and Content Management System

Since we needed a GUI for managing posts and media, I needed to take that into account when picking the tech. Lucky for me, my favourite static site generator — [Lume](https://lume.land) — has released a companion CMS solution which plays well with its parent project. After reading the docs, it seemed to tick off the boxes. Lume, here we go!

## Crafting the markup

I won't be focusing on Lume and the "backend" here, but instead describe how I do semantic markup and rely on many browser defaults and use modern CSS to create a clean theme for our blog.

**You can see the live site here: [brook.city](https://brook.city)**

Here's the main layout shell:

```html
<!doctype html>
<html lang="sv">
    <head>
        <title>{ title } — { subtitle }</title>

        <meta name="viewport" content="width=device-width, initial-scale=1">

        <meta name="theme-color" content="rgb(2 119 73)" media="(prefers-color-scheme: light)">
        <meta name="theme-color" content="oklch(25% 0.03 79.54)" media="(prefers-color-scheme: dark)">

        <link href="/style.css" rel="stylesheet">

        <link rel="alternate" type="application/rss+xml" title="Brook City posts feed (Atom)" href="/feed.xml">
        <link rel="alternate" type="application/feed+json" title="Brook City posts feed (JSON)" href="/feed.json">

        <link rel="me" href="https://fed.brid.gy/r/{ "/" |> url(true) }">
        <link rel="author" type="application/activity+json" href="https://fed.brid.gy/r/{ "/" |> url(true) }">
    </head>
    <body class="h-card">

        { include "templates/nav.vto" }

        <main>
            { content }
        </main>

        <footer role="contentinfo">
            <a href="https://open.spotify.com/track/7G3lxTsMfSx4yarMkfgnTC" class="u-url">♫ The World Is Yours</a> —
            <a href="mailto:{ email }" class="u-email">{ email }</a> —
            <a href="{ "/" |> url(true) }" class="u-url u-uid" rel="canonical">Home</a> —
            <a href="https://github.com/johanbrook/theworldisyours">Source</a>
        </footer>
    </body>
</html>
```

Things to note:

-   The blog is in Swedish, so let's not forget a proper `lang` on the root HTML element.
-   We offer both RSS and JSON feeds.
-   We syndicate posts to Fediverse and Bluesky via [Bridgy Fed](https://fed.brid.gy). Those `<link>` elements in the header help with that.
-   The whole homepage is a hCard, and the body is marked up with proper [Microformats](http://microformats.org).

## CSS

This is the entrypoint stylesheet:

```css
@layer reset, setup, theme, utils;

@import 'css/reset.css' layer(reset);

@import 'css/variables.css' layer(setup);
@import 'css/defaults.css' layer(setup);
@import 'css/layout.css' layer(setup);

@import 'css/components.css' layer(utils);
@import 'css/utils.css' layer(utils);

@import 'css/themes/south-africa.css' layer(theme);
```

I use Layers to… layer the various imported modules. Note that it's not strictly required in this simple structure, but I did it as an exercise for myself. Because, see how the `south-africa.css` module is imported at the bottom as a `theme` layer, but that layer comes second to last in the `@layer` declaration at the top.

### Reset

You can view the `reset.css` in its entirety [here](https://github.com/johanbrook/theworldisyours/blob/main/_includes/css/reset.css). It's based on work from [mayank](https://github.com/mayank99/reset.css/blob/main/package/index.css) and [Andy Bell](https://piccalil.li/blog/a-more-modern-css-reset/).

I personally find it nice and neat, and one can read through it in a couple of minutes (tops!) and understand the reasoning. The spirit is to _fall back to browser defaults where it makes sense_, and unify with saner defaults across browsers.

(Now when I think about it, one should probably move some things from this `reset.css` to a `defaults.css`, but naming schnaming.)

### Dynamic Type

Here's what I use for typography, structured as CSS variables:

```css
:root {
    --leading: 1.6;
    --sans: system-ui, sans-serif;
    --serif: ui-serif, "Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, serif;
    --mono: ui-monospace, monospace;
```
And in `defaults.css`, we kick things off with:

```css
html {
    /* 1. Sets a11y values on iOS/iPad OS. This also sets dynamic font size from the OS settings. */
    font: -apple-system-body;
    /* 2. Customise for my own line height and font. */
    line-height: var(--leading);
    font-family: var(--sans);
}
```
I got the `-apple-system-body` thing from [Craig Hockenberry](https://furbo.org/2024/07/04/dynamic-type-on-the-web/). He found out that, on Apple devices, you can let the website's font size be adjusted by the user as a system setting in iOS. This is neat, because it truly enables "full stack control" if the user chooses to have another font size than the default in the browser (`16px`), or, god forbid, the _CSS author's_ font size of choice!

I was skeptical at first, but now I've learned to _let go_ and let my visitor decide the font size.

### Vertical rhythm

I go all in on the [`rlh` units](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Values_and_units) in all spacings on the site. It maps to the line height defined on the root HTML element. I had `1.6` defined as `line-height` on `html` above, so `1rlh` then becomes:

```
1.6 leading × 13px root font size ≈ 20px lineheight (rlh)
```
And there we've got our rhythm unit! I use fractions and multiples of `1rlh` on all spacings in the site. It saves some mental energy since I know in the back of my head things will _probably_ look harmonic and nice with some multiple of the root rhythm unit.

### Custom fonts

Maybe you noticed that I use `system-ui` as default sans-serif font on the site. That's because I wanted to keep the file size down. Using default font stacks is perfectly fine in this use case. [Modern Font Stacks](https://modernfontstacks.com) is a great resource for exploring options.

But, for the main site title, I wanted to spruce things up a little: I wanted the [Bayon](https://fonts.google.com/specimen/Bayon) font. Since it was only for a couple of glyphs, and those glyphs were to be locked down — not dynamic — maybe I could subset the font to keep down the file size?

Turns out I could! Using the trusty Fontsquirrel's [Webfont generator](http://fontsquirrel.com/tools/webfont-generator), I could pick the glyphs I was going to be using after uploading the `.woff2` font files downloaded from Google Fonts. Much smoother process than I anticipated.

## The network tab

If we go to [brook.city](https://brook.city) and bring up the Network tab in your favorite web inspector, you'll see that it loads four resources:

1. `brook.city`: the root document (3.67 kB)
2. `style.css`: all CSS (4.61 kB).
3. `email-decode.min.js`: some stuff Cloudflare injects (1.10 kB).
4. `bayon-regular-webfont.woff2`: the title font (3.92 kB).

It clocks in at 29 kB page weight, under a single domain.

## Images

If we visit a post with embedde images, we'll see this markup:

```html
<picture>
    <source srcset="/uploads/img_2158-676w.avif, /uploads/img_2158-676w@2.avif 2x" type="image/avif">
    <img src="/uploads/img_2158-676w.jpg" alt="Kalk Bay" srcset="/uploads/img_2158-676w@2.jpg 2x" decoding="async" loading="lazy">
</picture>
```
This is how we do responsive images with modern image formats ([AVIF](https://caniuse.com/avif) in this case). I used [Lume's Picture plugin](https://lume.land/plugins/picture/), which does 100% of the heavy lifting.

1. Add plugin to site config.
2. Add an attribute to the parent DOM container what sizes you'd like for the images defined as `<img />` inside.
3. The plugin will physically generate those images at build time.

This is the container for a blog post with images inside:

```html
<article transform-images="avif jpg 676@2">
    <img src="/uploads/img_2158.jpg">
</article>
```

This means "generate in AVIF and JPG, with widths 676px and 676px × 2 (for hi-res screens)". The Lume plugin will replace that `img` with the `picture` above. Amazing! This is how I like tooling to act: Just Work™.

Note that we also use `loading="lazy"` for the image. This is a drop-in attribute you should use now. Visiting a single blog post has page weight 29 kB until you scroll down to the image, where it goes up to 187 kB.
