---
title: 'What''s new in Safari 9'
date: '2015-06-09 09:16'
tags:
    - apple
    - wwdc
    - safari
    - 'web development'
slug: whats-new-in-safari-9
---

I'm attending WWDC 2015, and during the web development session, Apple's Safari team showed off what's new in Safari 9. It includes iOS style effects, such as backdrop filters and scroll snapping with CSS, ES6 updates, other CSS niceties.

- [Backdrop filters](#backdrop-filters)
- [Scroll snap points](#scroll-snap-points)
- [CSS enhancements](#css-enhancements)
- [Force Touch API](#force-touch-api)
- [Javascript updates](#javascript-updates)

## Backdrop filters

You know the fancy dynamic blur background effects that arrived with iOS7? Where the content "below" a panel would be blurred with a semi transparent mask, but the actual elements in the panel would be as original.

Currently, the behaviour can be emulated with various techniques. Most common would be to create a copy of the content in the back, add a mask, blur some area, and overlay it on the original content. This is tedious – a maintenance nightmare – even when using it for images only.

So for Safari 9 (OS X and iOS), Apple has added the `backdrop-filter` property. It accepts values from the regular [CSS Filters specification](http://dev.w3.org/fxtf/filters/#typedef-filter-function-list). should be a applied to the element you would normally apply a semi transparent background too. You can combine several filters, as you'd do with the `filter` property. This is also submitted to be a W3C standard.

```css
// Styles for a top bar
.site-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  // Will blur and saturate any content below this top bar
  // as you scroll.
  backdrop-filter: blur(10px) saturate(100%);
}
```

This even works for video and other dynamic content as you scroll! But have in mind that rendering can be expensive, to be sure to test it before shipping.

## Scroll snap points

When doing galleries, carousels, and such for touch devices, we've traditionally resorted to use Javascript to handle the scrolling when you want control over where the scrolling should snap. Take the Photos.app in iOS as an example: when you flip through images, they'll snap to the edge of the screen when the scroll momentum stops, instead of overlapping. Apple has simplified this by adding support for scroll snapping directly in CSS (for iOS and OS X).

```css
#viewport {
  // Turn it on.
  -webkit-scroll-snap-type: mandatory;
  // Set a snap point every 300px on the X axis. 
  // Use -webkit-scroll-snap-points-y for Y axis.
  -webkit-scroll-snap-points-x: repeat(300px);
}
```

By using the `-webkit-scroll-snap-points-x` and `-webkit-scroll-snap-points-y` properties, we can set a repeating point with the `repeat` function, or use a regular value, such as:

- percentages and pixels
- viewport units
- calculated values with `calc()`

This is cool and all, but what if you've got dynamic content in this viewport? I.e. irregular sized blocks, such as non-cropped images, where you wouldn't hardcore a `repeat(300px)` value.

> **tldr;** Set both destination and coordinate properties to `50% 50%` to make irregular elements snap its center to the center point of the viewport. 

Safari solves this with the `-webkit-scroll-snap-destination` and `-webkit-scroll-snap-coordinate` properties. These properties controls the coordinates of where Safari should position your scrolling content in a viewport.

```css
#viewport {
  -webkit-scroll-snap-type: mandatory;
  // Destination for snapping. 50% 50% denotes the center.
  // Defaults to 0 (left or top).
  -webkit-scroll-snap-destination: 50% 50%;
  // How to align the snap coordinate of an element.
  // 50% 50% denotes the center.
  -webkit-scroll-snap-coordinate: 50% 50%;
}
```

These styles are available from Javascript with:

- `element.style.webkitScrollSnapType`
- `element.style.webkitScrollSnapPointsY`
- `element.style.webkitScrollSnapPointsX`
- `element.style.webkitScrollSnapDesitation`
- `element.style.webkitScrollSnapCoordinate`

Note that this may conflict with programmatic scroll, if you're using that.

## CSS enhancements

Safari now supports these unprefixed CSS properties:

- Transitions
- Animations
- Transforms
- Flexbox
- Columns
- [… and more](https://developer.apple.com/library/prerelease/mac/releasenotes/General/WhatsNewInSafari/Articles/Safari_9.html#//apple_ref/doc/uid/TP40014305-CH9-SW28)

### Feature detection

In Safari 9, it's possible to detect support for CSS properties and write conditional rules in a block:

```css
@supports(condition) {
  // Styles for condition
}
```

```css
@supports(-webkit-initial-letter: 3) {
  // Use fancy initial letter styles.
}
```

### CSS4 `:matches` selector

The `:matches` pseudo selector helps you mash a bunch of selectors together like this:

```css
// Before

.default .foo,
.default .bar,
.default .baz {
  color: red;
}

// With :matches

.default :matches(.foo, .bar, .baz) {
  color: red;
}
```

This groups all the denoted children of `.default` together.

## Force Touch API

Apple's also added a Javascript API for the Force Touch technology introduced in their latest Macbook.

Firstly, the `webkitForce` property is availabel on all Mouse Events. This is a number, which is the force of the current press on the track pad.

There are also events on a DOM element for listening to force touch events, which behaves like `mouseup`/`mousedown`:

- `webkitmouseforcechanged` - any change in force.
- `webkitmouseforcewillbegin` fires just before the `mousedown` event. Ideal for preventing default behavior.
- `webkitmouseforcedown` fires after `mousedown`, if the press is a force press.
- `webkitmouseforceup` fires after the above, if it's a force press.

The constants `MouseEvent.WEBKIT_FORCE_AT_MOUSE_DOWN` and `MouseEvent.WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN` represents the amount of force required for a regular and force click, respectively.

See [example app](https://developer.apple.com/library/prerelease/mac/samplecode/WebKitPhotoBrowser/Listings/scripts_new_scripts_js.html#//apple_ref/doc/uid/TP40016150-scripts_new_scripts_js-DontLinkElementID_9) for a sample implementation.

## Javascript updates

And lastly, we've got some new ES6 features:

- Class syntax
- Template literals
- Symbols
- Computer properties
- [… and more](https://developer.apple.com/library/prerelease/mac/releasenotes/General/WhatsNewInSafari/Articles/Safari_9.html#//apple_ref/doc/uid/TP40014305-CH9-SW27)

## Pinned tabs icon

Last but not least. Remember the Safari pinned tabs introduced at the WWDC keynote? You can use a custom icon shown when you site is pinned:

```html
<link rel="icon" sizes="any" mask href="icon.svg">
```

The SVG icon should, [according to Apple](https://developer.apple.com/library/prerelease/mac/releasenotes/General/WhatsNewInSafari/Articles/Safari_9.html#//apple_ref/doc/uid/TP40014305-CH9-SW20), have 100% black shapes and transparent background.

You can however set the color of the icon with:

```html
<meta name="theme-color" content="red">
```

***

I really like the snap and backdrop CSS support. I've missed the former for a while, but didn't see the latter coming. Hope they land in Chrome and the others soon.

[Complete release notes and links to sample code](https://developer.apple.com/library/prerelease/mac/releasenotes/General/WhatsNewInSafari/Introduction/Introduction.html#//apple_ref/doc/uid/TP40014305-CH1-SW1).
