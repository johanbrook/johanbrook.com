---
title: 'Bringing Order to CSS'
date: '2011-05-16 06:00'
tags:
    - Compass
    - CSS
    - Framework
    - Guidelines
    - Less
    - Order
    - SCSS
    - Structure
category: CSS
slug: bringing-order-to-css
---

**Web sites and applications** are getting more and more complex. Everything that aren’t simple web sites or blogs need a couple of views, a cross-browser CSS foundation, and Javascript. The development stage is only the first part – how are these code bases maintained, both by you and potentially other people, after the launch?

Inexperienced developers and designers often start out with a project very enthusiastically with writing the markup (often starting on the front page), then CSS styling, and then do the same thing again for the next view. It’s quite a linear process, and it even works in most cases.

But then what?

**The client wants some changes made** after a couple of weeks, and you dive back into the markup and CSS. Ugh. Yek. “I wrote that?” (you can tell this happened to me). Your code makes _perfect sense_ at the moment when you’re writing it, but when it’s time for a return it’s like putting your foot down in a wet, cold boot – it’s uncomfortable and weird, and you just want to get out of there. You make the necessary changes, but only to realize things are getting screwed up. The layout got broken when that element became too wide, and typographic adjustments had to be made in order to achieve a decent hierarchy.

And we haven’t started talking about the mess of spaghetti code yet, which is the site’s current CSS file(s). I really hate having lots of code (whatever language) in the same physical file. I just cannot get a decent overview, how funny it may sound. As I said before: the code may make perfect sense to you at first, but imagine coming back to it, or even another person coming back and has to start figuring out how you were thinking. It’s my version of hell. I heard someone on Twitter saying something like _“When writing code, imagine you’re writing it for a crazy serial-killer to read”_.

## Structuring CSS

This is nothing unique in web development. Hell, whole frameworks have been built just for this: giving structure and order to many people’s development styles. Frameworks like Ruby on Rails does an outstanding job helping you write solid, future-proof code (that you actually are able to understand something from a couple of months later). Even myself, who’s not a true Ruby dev, can figure out what a Rails app does by going through some of the files and directories. Every file and code snippet has its place. I like that – it should be _one_ way of doing things.

How is the state of CSS structuring? Not very good. There’s nothing resembling a standard in writing CSS whatsoever. Every designer/developer has to decide for themselves how the site’s style framework is going to behave (since a good site’s CSS styling really should be like a framework). Common structuring techniques includes:

- **Comments**. Of course – the larger and more, the better.
- **External importing**. With the CSS construct `@import` , you’re able to pull in external .css files, but alas with the expense of extra HTTP requests.
- **External referencing**. With the `<link>` element. Basically have several stylesheets loading in your site. Extra requests – thumbs down.

The last two bullet points are easily solvable with CSS pre-processors such as [Sass](http://sass-lang.com) or [Less](http://lesscss.org/). You’re able to work with several stylesheets and then just concatenate them into one, single master CSS file. Then you achieve true organization without performance losses.

**Just the very fact** that Sass and Less exist is a sign of that CSS today is too simple. Many praises its simplicity, and shouts “if you manage to mess up CSS, you’re doing it wrong!”, but during the months I’ve used Sass I can clearly feel the gap it fills when I work with “regular” CSS. I think the WebKit team also feel this coming (I earlier [linked to a presentation](http://jnbrk.se/dXBpwf) where a Google engineer described a draft of upcoming additions to CSS, including variables, mixins and more). CSS is quite a “dumb” language, not dynamic at all, and isn’t really that beautiful either.

## Applying Paradigms on CSS

There’s almost MVC frameworks for each programming language nowadays, with less or more strict rules how to organize the app’s files. Why can’t that exist in CSS? I firmly believe that principles and paradigms like [DRY](http://en.wikipedia.org/wiki/DRY) (_Don’t Repeat Yourself_) and [Convention over configuration](http://en.wikipedia.org/wiki/Convention_over_Configuration) is applicable on CSS. I’m sure larger organizations already have principles and style guides something like this, but wouldn’t it be nice if we had some sort of guideline, _a standard_?

### DRY

Speaks for itself – don’t write duplicated code. It takes some experience to be able to write really solid CSS, where you don’t have to grab Search And Replace to make global changes. It’s a matter of being smart, and think for the future. Don’t be overly precise.

Our new CSS3 properties is also a nice example of repeating yourself. You all know the dreaded Gradient syntax – or should I say – the myriad of browser vendor prefixes that make you write several lines of code just to pull off a simple cross-browser gradient:

    /* WebKit */
    background: #b4e1ea -webkit-gradient(linear, 50% 0%, 50% 100%, color-stop(0%, #dcf1f5), color-stop(100%, #b4e1ea));
    
    /* New-ish WebKit: Chrome style */
    background: #b4e1ea -webkit-linear-gradient(#dcf1f5, #b4e1ea);
    
    /* Firefox */
    background: #b4e1ea -moz-linear-gradient(#dcf1f5, #b4e1ea);
    
    /* Opera */
    background: #b4e1ea -o-linear-gradient(#dcf1f5, #b4e1ea);
    
    /* W3C */
    background: #b4e1ea linear-gradient(#dcf1f5, #b4e1ea);

(haven’t included code for generating SVG gradients for IE9)

Even though this is a necessary evil until things change, you shouldn’t have to write this. It’s craziness! Tedious to maintain, bloated, and just plain wrong.

In Sass or Less, it’s just a matter of creating a mixin returning all the different browser syntaxes and including it:

    @include linear-gradient(#dcf1f5, #b4e1ea);

I’m not saying you’re getting rid of all gradient code in the final stylesheet, but you _don’t have to look and work with it_ while writing/maintaining. Programmer happiness.

### Convention Over Configuration

Larger projects demand a comprehensible set of CSS styles. There are many lines of code, and you shouldn’t be spending time actually trying to find your way around this huge stylesheet. “God dammit, where did the previous designer put the styles for this box?!”. Wouldn’t it be nice with a decent structure for where to put the styles? It should be self-explanatory, so the next guy or girl is able to find the exact set of properties without searching too long. Every file should have its place.

![](http://johanbrook.com/core/wp-content/uploads/2011/05/filestructure-compressed.png) How I worked with my stylesheets in a recent project. Notice how only `sass/master.scss` is compiled into `stylesheets/master.css`

Above I’ve attached a screenshot of a structure I used in a recent project. Pretty straight-forward, right? You can sort of tell what the different files are doing. This is essentially what I’m talking about – a common pattern for working with stylesheets – how to name and structure them. If programmers can solve this, so can designers. This is leading me into next section:

## Modularity

Re-use is great, actually. To grasp that you’re actually able to use the same code in different places in a project – even in _several_ projects – is really something. Sass and Less provides import commands which lets you have all kinds of different files ready for re-use. As you saw in the screenshot in the last section, I had a file named `_base.scss` . In that file I keep all config variables, custom mixins, reset, helpers classes, et al. It’s really great when working with a micro- or daughter site – it’s just a matter of pulling in that base file and you’ve got access to the colour theme, font stacks, and other things that might’ve been tedious to specify all over again. If you feel for tweaking some stuff, it’s not a big deal since those changes will be imported into the other site’s stylesheet.

Working in small modules is a valuable lesson to learn the hard way. In my case, it helps me focus on a small piece of code instead of a huge Wall of Text thing. Nowadays I like separating projects into smaller pieces of CSS: maybe one partial for all styles regarding a blog post, another for global page styles, another for the footer, and so on. A rule of thumb would be: _“Better to have too many than too few”_. Nah, scratch that. Having too many partials/modules would be hell on earth.

## Outro

Imagine getting into an existing project and just _get_ everything from the start. _“Oh, the previous person made this quite easy for me to modify – I’m able to pull this off in no time and don’t waste time wading through swamps of code”_. I’m reluctant to call it a “framework” – something like “guidelines”, “codex”, “common courtesy”, “pseudo-standard” – I don’t know – but I hope you get the idea.

We’ve got the tools. Sass and Less provide the foundation, and sort-of frameworks like [Compass](http://compass-style.org) for the former gets you started with boilerplate code in no time. Until CSS provides a native way of dealing with organizing stylesheets without resorting to the regular import methods I think Sass or Less is the way to go. It’s really not hard at all to get started. Don’t fear the command line! The projects’ sites provide great tutorials and introductions.

In the end I guess it’s also about writing friendly, loose, extensible code. Code for change. Imagine the guy who’s about to work with your code being a crazy ax murderer coming after with you after the first bug he finds.
