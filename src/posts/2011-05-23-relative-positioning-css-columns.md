---
title: 'Relative positioning and CSS Columns'
date: '2011-05-23 08:00'
tags:
    - Antialiasing
    - Columns
    - CSS
    - 'position: relative'
    - 'Relative positioning'
category: CSS
slug: relative-positioning-and-css-columns
---

Live as you teach, they say. In the [last post](http://jnbrk.se/kkstoA) I linked to a solution to text rendering problems in conjunction with `position: relative` in the CSS. Removing the property, or declaring `position: static` solves the issue.

I usually set relative positioning globally on common block level elements, since it helps me position other elements inside them easily. I added it to my common, reusable CSS file since it felt like I was declaring `position: relative` on every other div and paragraph tag. But as you know, firing a shotgun feels great at first, but you always have to deal with the mess afterwards.

I actually had two problems with relative positioning, and they were showing up in Safari:

  ![Text rendering problems in Safari](http://a.yfrog.com/img612/5716/qpqy.png) Column and text rendering issues in Safari

Huge thanks to [@ViktorBijlenga](http://twitter.com/ViktorBijlenga) for bringing this to my attention

The text rendering/aliasing issues are identical to the ones I linked to in the [last post](http://jnbrk.se/kkstoA). Timing, right? `position: relative` was the crook here as well. But what about the columns? Safari seemingly refused to accept the `-webkit-column-count/gap` declarations. Chrome went along well. Turns out **child elements to a parent where CSS Columns are declared cant’t have relative positioning**. It’ll cause troubles in Safari.

Therefore:

    .columns{
        -webkit-column-count: 3;
        -webkit-column-gap: 1.5em;
    }
    
    .columns * {
        position: static;
    }

.. solves the problems, if you still have `position: relative` declared globally. I won’t.
