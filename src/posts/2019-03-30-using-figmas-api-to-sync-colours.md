---
title: Using Figma's API to sync colours with your CSS
slug: figma-api-colors-css
date: 2019-03-30
location: A kitchen table in Stockholm
excerpt: How I used Figma's web API to sync colours with a CSS codebase, to close the gap between design resource and the implementation.
tags:
    - dev
    - css
---

**Design systems** have become popular recently. Even if you don't need a full blown one, it might
be nice to collect design resources in a single, canonical location. In this post, I'll describe how
I worked with Figma and their API to sync colours with a CSS codebase.

## The problem

At Lookback, we had all visual design collected across Sketch files. Sketch is nice, but as our
platform grew with more apps, interfaces, and flows, it was clear that the workflow of "a single
designer owning all files" just didn't hold up:

- It would be a constant stream of new Sketch files or PNG exports being shared in the Trello cards.
- For each small change, the designer had to go back to the Sketch file, do a minor change, export
  again, upload for review.
- There was emphasis on collaboration. Merging in feedback from another person's work in Sketch was
  a pain.
- Managing colours and other styles _across_ Sketch files was a pain.

**Enter Figma.**

[Figma](https://www.figma.com) is a design software capable of everything Sketch can do, but with a
few important details:

- It's web based. Accessible everywhere with an option to install locally as an macOS app.
- It's completely cloud based. No local files to sync. No merging and branching. It's saved as you
  go.
- It supports shared libraries of components and styles.
- It supports simple prototyping right out of the box.
- It's **collaborative**. You can design in high or low fidelity with coworkers in _real time_ 😍

I can't stress the last point enough. This has severely improved our design flow. It's more
democratic and transparent, as anybody with a Figma account can pop into a design and poke around.
Figma has completely eliminated the old ways of doing design flows.

**A month in, I think Figma is a killer app for doing interface design at the moment.**

## Back to the problem

I set out on trying out Figma in our organisation for a while. The first task was to structure out
colour system, which at the time was very loosely defined and pretty ad-hoc.

Describing how I created the colour system is out of scope for this post. The end result should
anyway be

- a grid of colours named after hue and brightness,
- the same colours collected in Figma's colour library

<figure class="image--full">
  <img src="/assets/posts/color-system.png" alt="Color system">
</figure>

_How do I use these colours in my web frontend?_

The Old Way would be to manually copy the HEX codes over to (S)CSS variables and make sure to keep
them up to date. Now, the colours might not change that frequently, so this might not be a huge
pain. But when you're in the exploratory phase, it's very messy to go back and forth all the time.

I noticed Figma has an [API](https://www.figma.com/developers) ✨Rejoice! The
[docs](https://www.figma.com/developers/docs) are lovely, and the only thing needed to do simple
HTTP REST calls is an access token you generate for yourself.

My goal was to:

- Sync the **names** and **HEX colour codes** from my Figma file down into a JSON or JS file.
- This file was to be used in the build process for my CSS, so variables could be created.

After playing around, I ended up with a Node script which fetches the colour styles for a team and
writes them to a `colors.js` file. It's a super simple script which just calls their endpoints and
pieces together all the styles into a big hash.

<p class="tc">
  <a class="btn" href="https://gist.github.com/brookback/cce828202ef40ddddf2d1aa731929c90">fetch-figma-colors.js</a>
</p>

⚠️ _You have to tweak some variables in there!_

It was a bit fiddly to get the actual HEX codes of the styles, since Figma doesn't include them in
the call to the `/styles` API endpoint. Therefore, I had to cross reference the name of the styles
with the colour samples in the document. I've sent this feedback to the Figma team.

Run it like this:

```bash
FIGMA_PERSONAL_TOKEN=<your-token> node fetch-figma-colors.js
```

The resulting file, `colors.js`, will look like this:

```js
/* eslint-disable */
/* Updated at Thu, 21 Mar 2019 21:06:58 GMT*/
module.exports = {
    /** Suitable as background color. */
    'blue-10': '#f6fbfd',
    /** Suitable as default border color. */
    'blue-20': '#d7f3ff',
    'blue-30': '#a4e3ff',
    'blue-40': '#60ceff',
    'blue-50': '#00a0e8',
    /** Suitable as default button and link color. */
    'blue-60': '#007db5',
    /** Suitable as heading color. */
    'blue-70': '#006693',
    /** Suitable as body text color. */
    'blue-80': '#004260',
    'blue-90': '#002b3e',
    'blue-100': '#041820',
    // ...
};
```

Neat! Even with custom comments I wrote for some styles in Figma! 😍

<figure>
  <img src="/assets/posts/figma-styles.png" style="width: 231px" alt="Figma styles">
</figure>

_Note:_ You can of course make it be a JSON file instead if that's your thing, but I wanted to keep
the comments from Figma as JS comments, as JSON doesn't support that.

## Using the styles in my CSS

This is were things differ for people. Some use Sass, others use LESS or PostCSS, or just _nothing
at all_.

**You have to figure out how to get this hash of colours into your styles somehow.**

For me, I'm in the midst of moving over our CSS foundation from Sass to a PostCSS pipeline, using
[Tailwind](https://tailwindcss.com).

Tailwind is sort of like a _generator for design systems_. It's similar to the
[Tachyons toolkit](https://tachyons.io), but goes even further, with more things automated.

Both Tailwind and Tachyons are proponents of something called _functional CSS_. This is out of scope
of this post, but I recommend reading these articles:

- [CSS and scalability](http://mrmrs.cc/writing/2016/03/24/scalable-css/)
- [Functional CSS](https://jon.gold/2015/07/functional-css/)

Tailwind is nice since I can configure widths, margins, colours – everything – in a Javascript
config file, and then generate a CSS foundation from that.

See more in the [documentation](https://tailwindcss.com/docs/configuration), but in a nutshell it
looks like this:

```js
// tailwind.config.js

module.exports = {
    theme: {
        colors: {
            white: '#fff',
            // ...
        },
    },
};
```

Tailwind uses this colour scale to create border, text, and background colours as class names. I can
now use it like this in my HTML _or_ CSS code:

```html
<!-- HTML -->

<div class="bg-white">
  <p>Hello!</p>
</div>
```

or

```css
/* CSS */

div {
  @apply bg-white;
}

/* or: */

div {
  background-color: theme('colors.white');
}
```

The final thing to do is thus to import our colours into the config, et voíla:

```js
// tailwind.config.js
const colors = require('./colors');

module.exports = {
    theme: {
        colors,
    },
};
```

```html
<div class="bg-blue-10">
  <h1 class="text-orange-60">Orange 60</h1>
</div>
```

Done! 🌈

## Recap

1. We create colour styles in Figma, according to the art on how to create colour systems.
2. We update our CSS codebase with the colour styles' names and HEX codes.
3. Those are imported into our Tailwind config and the CSS is built based on the colours.
4. We have the colours available as config variables in our CSS code or as classes in our HTML ✨

Anytime you'd like to adjust the colours in your system, be sure to run the script in the CSS
codebase and distribute a new version of the generated CSS file.

Future work could include specifying whole component styles in Figma and parsing that into
corresponding CSS rules ✌️
