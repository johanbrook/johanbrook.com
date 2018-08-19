---
title: 'Realigning Johanbrook.com'
date: '2012-02-12T19:21'
keywords:
    - CSS
    - Design
    - Redesign
    - Typography
    - layout
    - 'golden ratio'
    - grid
category: 'This site'
slug: realigning-johanbrookcom
---

Today I pushed a new theme to this site. It's a lot cleaner and to me more readable than the previous one. Some points to bring up:

## Layout
I still go with the two-column layout. This time, I fully ditched any 12 or 16 column grids, and went fluid all the way, i.e. I've made all measures relative to each other, and the Golden Ratio. I've used a 6pt baseline grid, and a [modular scale](http://modularscale.com/). It was actually quite relaxing 'letting go' of the old grids and start fresh.
 
 [
 ![Grid](http://f.cl.ly/items/1Y0L3g0l1K2y3u2A2t3Q/Slammer.png) ](http://f.cl.ly/items/1Y0L3g0l1K2y3u2A2t3Q/Slammer.png)
 Frontpage with Golden Ratio, module, and baseline overlay
 
 Try adding `?dev=1` to any URL on the site, and press and hold G on your keyboard to view the baseline grid.
## Typography and Colours
Switched the somewhat boring Georgia for **PT Serif**, and Helvetica for **Lato**. Both are served via Google Webfonts Directory. The goal with the realignment was to create more whitespace to focus on the typography, and for that great typefaces were needed. 
 
 This is also the first time I use the new-ish `rem` unit (with a fallback). There are almost no pixel values as far as the eyes can see.
 
 The colour palette is quite sparse: just plain white, kinda-black, and cerise red.
## Under the Hood
I have for once not used Compass for this project. Don't know why, just felt for a change – trying out something new. That 'new' is [Bourbon](http://thoughtbot.com/bourbon/) by Thoughtbot. A lightweight collection of Sass mixins. Might as well, right?
 
 The very small amount of Javascript I've included is written in CoffeeScript, which I've been dabbling with recently.
## Responsiveness
No need to explain anything here. I believe every web designer and developer with self-respect should create responsive websites for themselves and clients these days. For this one I have two breakpoints set in ems. There is no max-width of the container.
## Javascript?
Nope, almost none. I don't need jQuery for anything, so it felt good getting rid of all that fat.
## More writing?
Hopefully this will encourage me to blog more often :) (as I and many before me have said – all the time).
 
 Thanks for reading.
