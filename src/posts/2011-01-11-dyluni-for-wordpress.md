---
title: 'Dyluni for Wordpress'
date: 2011-01-11
tags:
    - dev
category: Frameworks
slug: dyluni-for-wordpress
---

When you've created themes for Wordpress for a while, you're starting to feel that you're doing the
same thing over and over again (which you technically are). Since many Wordpress sites got features
you can and should reuse it would be awesome with a great boilerplate theme, wouldn't it? A
stripped, starting-off theme with all the essentials.

## The theme

I finally got around to sort out the mess in my Sites folder, and structured and cleaned up this
resemblance of a boilerplate theme I've been using for my last couple of projects. Since I'm using
[Sass](http://sass-lang.com) for generating CSS, I tossed in my pre-written Sass files as well, also
known as [Dyluni Framework](https://github.com/johanbrook/dyluni) (such lame names, but might as
well be unique). Note that this is my personal setup: go ahead and remove the stuff you don't
need/want and call me a lunatic. It's okay. I think it's a pretty solid template for starting off
new Wordpress sites, so why not share it?

### Tech

The markup is HTML5 (gimme a 'hell yeah') since I firmly believe it's the future. You'll see some
CSS3 in the styling files, but I've worked quite hard with the semantics of our newest version of
HTML. It's a bit trickier – not everybody are not mastering it yet (with that said, I'm of course
not claiming that my markup in this theme is error-free: I'd love your suggestions and help!). ARIA
roles are added and used as hooks in the CSS. I've prepared some media queries for responsive web
design for you, as well as a nice and cozy square grid for you. It's simply the 35 column
[Square Grid](http://thesquaregrid.com/) with a 28px baseline (column and baseline image files
reside in the "images" folder). Press 'B' on your keyboard for toggling the grid overlay. Be sure to
remove that in production though. Go though the files and code quickly to get a hold of everything.
Check out the stuff so you know what's actually happening here. By that I mean the PHP template
files, the Sass files, the Javascript and the functions.php file. Not every CSS class or PHP
functions is meant for use out-of-the-box. As said, it's a boilerplate.

## Download

[I've put the source on Github](https://github.com/johanbrook/dyluni-for-wordpress) but you may
[grab a finished zip download from here](https://github.com/johanbrook/dyluni-for-wordpress/zipball/master).
I'd love suggestions and feedback!
