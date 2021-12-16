---
title: 'A simpler CSS3 Gradient syntax'
link: 'http://webkit.org/blog/1424/css3-gradients/'
date: 2011-01-14
keywords:
    - CSS3
    - Gradients
    - linear
    - nightly
    - simple
    - syntax
    - Webkit
category: CSS
slug: a-simpler-css3-gradient-syntax
---

The syntax for CSS3 Gradients has in Webkit been something of a pain, frankly. I prefer Gecko's more straight-forward version, but since I'm using [Sass](http://sass-lang.com) with its mixins, it's not a huge deal. In a blog post posted today, the Webkit team describes a new simpler gradient syntax. The old one dealt with percent values, it wasn't very liberal with the order of the arguments, and so on. Here's an example of the new syntax for a linear gradient:

    -webkit-linear-gradient(left, white, black)
Quite nice, huh? Simple, straight-forward, fully readable. The present syntax would be

    -webkit-gradient(linear, left top, right bottom, from(black), to(white));
The Webkit engine takes four gradient functions:
- `linear-gradient()`
- `radial-gradient()`
- `repeating-linear-gradient()`
- `repeating-radial-gradient()`

This is more like the Mozilla's implementation where you specify the type (linear, radial etc.) in the function name itself, not as an argument. Even the radial-gradient function is easier to actually write from memory now. This new syntax is available in the latest Webkit nightly build, and there's no word on when it'll be usable in Safari or Chrome. We'll see. Anyway, great work, Webkit team!
