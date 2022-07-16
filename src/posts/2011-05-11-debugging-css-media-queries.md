---
title: 'Debugging CSS Media Queries'
excerpt: 'In Responsive Web Design we’re working with different states, widths, and viewport sizes. Fluidity and adaptive behavior is a hot subject nowadays, and it’s perfectly justified when looking at today’s mobile browser landscape. We achieve this with CSS’s Media Queries. But sometimes it can be messy – I’m gonna share a quick tip for indicating (with pure CSS) which media query that has actually kicked in.'
date: 2011-05-11
keywords:
    - CSS
    - CSS3
    - 'Media Queries'
    - 'Responsive Web Design'
    - Sass
    - SCSS
    - Viewports
category: CSS
slug: debugging-css-media-queries
---

**In Responsive Web Design** we’re working with different states, widths, and viewport sizes.
Fluidity and adaptive behavior is a hot subject nowadays, and it’s perfectly justified when looking
at today’s mobile browser landscape. We achieve this with CSS’s Media Queries. But sometimes it can
be messy – I’m gonna share a quick tip for indicating (with pure CSS) which media query that has
actually kicked in.

## The problem

When I’m in the early markup stage of a site project I usually lay out a solid, fluid grid
foundation to build upon. I’m carving out the different sections of the design in rough code and am
also playing around with some media queries – deciding how many to use and how. Some debug stuff is
used; boxes that change colour when different media queries fires, and so on. But I sort of wanted a
more slick way of visually showing when the media queries fired, and I created one. It’s dead simple
– no fancy stuff – but it works. I also have no idea wether it’s already been done or not.

[Media Query debugger demo](http://playground.johanbrook.com/css/mediaquerydebug.html)

## Code

Here’s a basic media query targeting mainly tablets:

    @media only screen and (min-width: 768px) and (max-width: 979px){ body{ /* code */ } }

It’ll kick in when the viewport is in between 768px and 979px. Nothing weird, you write the CSS as
usual. However, check out the code below:

    @media only screen and (min-width: 768px) and (max-width: 979px){ body{ /* code */ } body::before{ content: "Tablet media query (768 < 979) fired"; font-weight: bold; display: block; text-align: center; background: rgba(255,255,0, 0.9); /* Semi-transparent yellow */ position: absolute; top: 0; left: 0; right: 0; z-index: 99; } }

Using the `::before` pseudo selector, I created a phantom element with some descriptive content and
styling which lies on top of the web page. That’s it! Here's a
[demo](http://playground.johanbrook.com/css/mediaquerydebug.html).

With this you can separate media queries in a quick, clear, and effortless way. You can replicate
this in Javascript, of course, and maybe also patch one issue I’ve come across: if several media
queries overlap each other, only one indicator bar will be shown.

It may also be clever to use this in a “debug mode”, i.e. apply a `debug` class to the `body`
element, and go on and write:

    body.debug::before{ /* .. all the stuff .. */ }

Now you’re able to quickly activate and deactivate the indicator bars. Applying a body class would
also let use reuse some of the code described above (it would be tedious to write all that stuff
over and over again).

## More: For Sass users

I love [Sass](http://sass-lang.com). I use it every day, and can’t imagine writing larger chunks of
CSS without it. For this example, Sass would be a perfect fit (for a quick course, check out the
project’s website and tutorial).

### Reuse the debug message

The CSS for the indicator bars could be made into a
[mixin](http://sass-lang.com/tutorial.html#mixins). Mixins are essentially chunks of CSS code you
can include anywhere in the document (great for reusability), and you call them in a manner not too
different from function calls.

    @mixin debugmessage($message, $color: rgba(255,255,0, 0.9) ){ &::before{ content: $message; font-weight: bold; display: block; text-align: center; background: #{$color}; position: absolute; right: 0; left: 0; top: 0; z-index: 99; } }

It’s exactly the same code as the first pure CSS example, but I’ve replaced the `content` and
`background` values with to arguments. The mixin is later included in the media query:

    @media only screen and (min-width: 768px) and (max-width: 979px){ body{ @include debugmessage("Tablet media query fired"); } }

Simple right? It’s clean, nice and **reusable**. I’m also able to go ahead and send a different
colour along with the mixin (right now, semi-transparent yellow is default if no other argument is
given):

    @include debugmessage("Tablet media query fired", "red");

### Debug mode

Thanks to Sass’ variables, I'm able to declare a global, top-scope variable at the top of my Sass
sheets called `$DEBUG` to keep track of thingss. During development I set it to `true` . This trick
is handy when writing things you might want to turn off when the site launches:

    @if($DEBUG == true){ @include debugmessage("Mobile media query fired", "orange"); }

There. Even better, right?

## Outro

I randomly created this during a project, and it’s a quick and dirty way of detecting different
viewport widths. Give it a spin, and give me a shout ( [@johanbrook](http://twitter.com/johanbrook))
if you have any thoughts.
