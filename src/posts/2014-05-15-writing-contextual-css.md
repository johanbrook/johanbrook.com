---
title: 'Writing contextual CSS'
date: 2014-05-15
category: css
keywords:
    - css
    - context
    - scss
    - media-queries
    - organization
slug: writing-contextual-css
---

Organization and structure of CSS might be one of the largest difficulties for beginners as for professionals in web design. It *is* hard writing good CSS. It is somewhat easer with pre-processors (SCSS, LESS, Stylus), but they'll only give you the tools: it's up to you how to use them (what I can't do without is the `@import` feature).

What I've learnt during recent years is to write **contextual CSS**: how similar elements and properties should be close to each other in the code. How I want to find the properties of an element in *one* place. This post details how I prefer to write CSS, based on the number of projects where I've been forced to dig through my own code.

## Finding all properties in one place

When I first started doing web design, I (as you often do) started out by reading other people's HTML and CSS. Inspecting every element, checking out the underlying CSS structure. I noted that many developers tended to split their stylesheets in files such as `layout.css`, `typography.css`, and more. I didn't questioned why, but did the same. I ended up disliking the approach. Why? I jumped between the two stylesheets to find and alter properties.

When going through my (and others') CSS, I want to find properties of an element and find them fast. Depending on how one is doing abstractions (that's a future post of mine) I don't want to jump around in the partials to find that particular place where those special properties are sneaked into the code.

I believe it's perfectly fine to mix and match all kinds of CSS properties: colors, typography, box model stuff. Go nuts. Since it's very seldom those categories won't end up affecting each other anyway, I don't see any reason why they can't go together. For instance, when you're changing font sizes you may also have to tweak the paddings.

## Proximity of responsive styles: inline media queries

This approach can go for responsive CSS as well. One often has separate stylesheets for different viewports where all CSS for that particular viewport goes. Perhaps `small.css`, `medium.css`, and so on. This is cool. If I want to tweak styles for a particular viewport I visit that file, simple as that.

*But*, that also calls for jumping between contexts, and I've started to find that tiring. When an element's properties are spread out over several files I tend to lose grasp of the whole thing. This is a nightmare in semi to large projects.

But pre-processors got our back. By using inline media queries, mixins, SCSS placeholders, and variables, one can write the responsive styles in the same context as the element is defined in the core CSS:

```css
// Custom mixin using SCSS placeholders
@mixin respond($width, $mode: "max") {
	@media only screen and (#{$mode}-width: $width) {
		@content;
	}
}

$small-screen: 30em;

h1 {
  color: #000;
  font-size: 2em;

  @include respond($small-screen) {
    font-size: 1.5em;
  }
}
```

will compile to

```css
h1 {
  color: #000;
  font-size: 2em;
}
@media only screen and (max-width: 30em) {
  h1 {
    font-size: 1.5em;
  }
}
```

So instead of having the declaration of the `h1` font site in a separate `_small.scss` partial, we can write it beside the original definition (if that position is suitable).

I've started to fall in love in this solution and have used it in a couple of smaller live projects. My workflow becomes much efficient when I can tweak the different media queries at one place.

### Performance of repeated media query blocks

*"That's not DRY!"*, you might say. Well, it really doesn't matter, others have concluded.

The post [Sass and Media Queries](http://sasscast.tumblr.com/post/38673939456/sass-and-media-queries) on SassCast comes to the conclusion that for performance, it really doesn't matter if you're having repeated media query blocks inlined in your SCSS code, *unless* it's a huge number (around 2000+ blocks).

There's a [thread](http://css-tricks.com/forums/topic/scss-inline-media-queries-vs-separate-media-query-blocks/) on this subject in the CSS Tricks forums ("SCSS: Inline media queries vs separate media query blocks"). A commenter mentioned a Ruby gem for merging repeated media query blocks together: [Sass Media Query Combiner](https://github.com/aaronjensen/sass-media_query_combiner).

## Conclusion

This might seem like a small detail, not worthy of a post, but try it out: I find it really awesome. Life's too short for premature optimization of CSS files: Gzip will have your back.
