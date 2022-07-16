---
title: 'Use the current color in CSS with the currentcolor keyword'
link: 'http://nimbupani.com/current-color-in-css.html'
date: 2011-01-28
keywords:
    - color
    - CSS
    - 'current color'
    - inherit
category: CSS
slug: use-the-current-color-in-css-with-the-currentcolor-keyword
---

Say you have a paragraph with the CSS of `color: red;` . If you would want to add a border in the
same color you would just have to type `border: 1px solid;` . The border-color inherits from the
paragraphs `color` property. How about using your element's color value for other things than
border-colors? A neat CSS keyword I didn't know about makes this possible: `currentcolor` . Treat it
as any other color keyword (like red, blue, green etc.) and wherever it's used, the color of the
`color` is used.

    p {
       color: red;
    }

    p span{
       background: currentcolor;
    }

Firefox, Safari, Chrome and Opera supports the keyword but alas, not IE9 yet.
