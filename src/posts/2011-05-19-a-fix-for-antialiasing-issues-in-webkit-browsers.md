---
title: 'A fix for antialiasing issues in WebKit browsers'
link: 'http://technology.posterous.com/webkit-hardware-acceleration-bleeding-into-su'
date: 2011-05-19
tags:
    - dev
    - css
category: CSS
slug: a-fix-for-antialiasing-issues-in-webkit-browsers
---

CSS Transforms, Transitions and Animations are great and all, but apparently they are causing issues
with some text on a page. I've experienced those issues on my site, and I couldn't for my life
figure out what the problem was. Some text paragraphs could suddenly lose their antialiasing, and
look very jagged and, yeah, aliased. They would yet get antialiasing again when I scrolled the page
up and down, or resized the browser window. Weirdness. Follow the link above for a post on the
Posterous blog about the issue. Apparently, WebKit's 3D Transforms were the culprits, since it gives
the relevant elements hardware acceleration, and ...

> When an element gets hardware accelerated in Webkit, sub-pixel anti-aliasing no longer works.

## Fix

How to fix? Play around with the 3D Transforms on the page, or remove any `position: relative;` on
parent elements. Webkit removes antialiasing on text while animating (which is a huge gain in
performance), and somehow relative positioning screws things up. Better: recent WebKit nightly
builds fix this issue, so I guess I have to play the waiting game.
