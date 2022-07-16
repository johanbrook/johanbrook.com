---
title: 'Webkit to get CSS variables, mixins, nesting?'
link: 'http://www.xanthir.com/talks/2011-01-12/slides.html'
date: 2011-01-17
keywords:
    - CSS
    - Less
    - mixins
    - 'nested rules'
    - Sass
    - variables
    - Webkit
category: CSS
slug: webkit-to-get-css-variables-mixins-nesting
---

[Tab Atkins](http://twitter.com/tabatkins) of Google has made a couple of slides (navigate with the
arrow keys) explaining a couple of possible upcoming features to Webkit: CSS variables, mixin blocks
and selector nesting. That's pretty huge, given that people have been screaming for those features
for years and years. Hell, a couple of smart guys even wrote scripts to compile (yeah, _compile_)
their own form of CSS syntax to regular CSS ( [Sass](http://sass-lang.com) and
[Less](http://lesscss.org/)).

According to Atkins' slides the features are very experimental, and we probably won't see them until
the end of the year. I'm gonna talk about the three most sought after features: variables, mixins
and nesting.

_This article is also translated to [Serbo-Croatian](http://science.webhostinggeeks.com/desing-css)
language by Anja Skrba from [Webhostinggeeks.com](http://webhostinggeeks.com/)_

## Variables

The syntax of CSS variables brought up in the presentation is as follows:

    @var header-color color #006;
    @var main-color color #06c;
    @var secondary-color color #c06;

    a { color: var(main-color); }

The corresponding Sass syntax would be:

    $header-color: #006;
    $main-color: #06c;
    $secondary-color: #c06;

    a { color: $main-color; }

You declare with the keyword `@var` , then the name and last the value. You insert the variable by
writing `var(var-name)` . Pretty straight-forward, but personally I find the syntax a bit awkward.
Why the need for the `@var` keyword? Why not just `@var-name` ? Why no colon between the variable
name and the value? And why the tedious `var(variable-name)` construction?

Variables are great. I use them every day in Sass, but I'd be happy to see a less clunky syntax.

## Mixins

Mixins are blocks of code you may include anywhere in the document. It's great for code reuse, and
to get away from non-semantic classes in your HTML code. A prime example is the clearfix method:
instead of applying a `clearfix` class to an HTML element, just write (in Sass) `@include clearfix;`
in the stylesheet for that element. Nice and clean.

In the proposed CSS syntax you declare mixins by writing:

    @mixin error {
       background: #fdd;
       color: red;
       font-weight: bold;
    }

    div.error {
       border: thick solid red;
       padding: .5em;
       @mixin error;
    }

It's a really slick way to reuse code. Growing sick of writing
[long, messy CSS3 gradient code?](http://jnbrk.se/fp7c68) Just define a mixin with some parameters
and include it where appropriate. This syntax is alright, though I find the parameter declaration a
bit weird.

## Nesting

When writing regular CSS you can't nest selectors. That is, you can't step down in the DOM hierarchy
without having to write all the parent selectors again, like this:

    #main > header > h1{
       font-size: 2em;
       background: blue;
       color: white;
    }
    #main > header > h1 > a{
       color: #ddf;
    }
    #main > header > h1 > a:visited{
       color: #fdf;
    }

I hate this kind of writing. It feels so unnecessary and unintuitive. Atkins has proposed this
syntax:

    #main > header > h1 {
      font-size: 2em;
      background: blue;
      color: white;

      @this > a {
        color: #ddf;

        @this:visited {
          color: #fdf;
        }
      }
    }

This feels more natural and flexible. Changing the id attribute of the header? No problem, just
change at one place in the code. The syntax in Sass and Less isn't too far away from this one
either.

## Outro

I've been using Sass since last summer, and I always make use of it for every project by now. Since
you compile to regular CSS, there are no compability issues whatsoever. The question is: if these
fancy features would make into Safari and Chrome sometime in the future, how would we handle the
stylesheets for Firefox, Internet Explorer and Opera? Separate ones? Nope, I wouldn't think so. It
has to be a standard to work out, and we all know that the working groups are slooow to decide
things.

For now Sass works great for me, but I think it's time to make a serious attempt to push the
features "into the broad mass". To see some cleaner stylesheets out on the interwebz would be a
godsend gift.
