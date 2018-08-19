---
title: Redesigned
date: '2011-04-18T01:39'
keywords:
    - Redesign
category: 'This site'
slug: redesigned
---

**You know how it is** with redesigns – they’re like drugs to a designer. Some last longer than others, but soon enough you'll need your fix. My site is always in constant redesign mode, with a goal to not have to make another redesign. Actually when it comes to site redesigns, I think it’s quite incorrect to call it _a redesign_. Quite blurry, to be honest. To _realign_ the elements sounds better to me – to take a look at the old site and ask yourself: “What’s working in this design, and what’s not?”. It’s a constant iteration thing, and I’ve tried to bring the elements and concepts I liked the most from the old design into this one.

Anyway, time for the nitty gritty. Why a new design? I could actually only find one single answer: I had grown tired of the old, quite inflexible, design, and new I could create a better one. The new one (I’ll call it _‘Fluid’_ from now on) is more conventional (centered, a real sidebar), and is held together a bit more with the help from the body wrapper. I’ve got more space for stuff (like Topics in the sidebar) but am still keeping the minimalism to some extent.

### History

I was initially planning to move my whole site over to [GitHub Pages](http://pages.github.com/) and publish everything as static files with the help from the stunningly cool [Jekyll](http://jekyllrb.com/). I’ve always used Wordpress for this site, since it was (still is) the only CMS that was easy and straight-forward enough to use for a personal site and on a cheap shared host, but during the years I’ve started to grown tired of Wordpress and all it’s quirky annoyances. It’s bloated, poorly written, and it’s PHP. Every year I promise myself to get a freaking VPS already and get started with Ruby, Python or some other nice language or platform … Anyway: Jekyll along with GitHub Pages worked really good. Believe me, you’ll get turned on handling your whole site in static files. No database dabbling whatsoever. Everything managed with git. Writing every new post in Markdown and storing it on your own harddrive is such a cool thing, and we haven’t even got into all the hacky things you can do with a couple of scripts.

However, after playing with Jekyll for a while, I realized I needed more. I’m still a Ruby newbie, and I had to write some stuff on my own to get Jekyll to behave as I wanted, but there were even more stuff to do. Stuff I didn’t have the skills or time to solve when working with my personal site. I also realized I had to do tons of redirection work to avoid having Google get all confused over the new structure and permalinks. When moving around things in Wordpress, the backend automatically does these redirections for you. I decided to go back to Wordpress (for now).

The beta site I made with Jekyll before moving on to Wordpress may be viewed at [http://beta.johanbrook.com/](http://beta.johanbrook.com/) (Source: [https://github.com/johanbrook/johanbrook.github.com](https://github.com/johanbrook/johanbrook.github.com)).

Now the site runs Wordpress 3.1.1 with lots of finetuned performance optimizations to make it lightning fast.

## Site structure

A big difference from the old design is that I now show all the latest posts on the frontpage. I couldn’t see why not, so why not? Makes everything a bit more dynamic and inviting. My portfolio is at the [Work page](http://johanbrook.com/work).

### Posts

I’ve removed the custom post type ‘Quickies’. I used Quickies for posting short, often linked, posts about stuff that interested me. The regular Posts were meant for longer pieces. I built that back when Post Formats had yet to arrive in Wordpress, and there were no other way to separate the different types of posts. But the Custom Post Types functionality is quite harsh on separating things – the line between Posts and Quickies became too thick. Now all posts are in a single feed like they should be.

### Topics

Topics weren’t that prioritized in the old design. In Fluid I use them more extensively – they are even in the permalinks.

## Typography

For the last two designs I’ve used [Droid Serif](http://www.google.com/webfonts/family?family=Droid+Serif&subset=latin) as my main serif body font, and Helvetica Neue for the sans-serif (never really liked Helvetica for main body font – hard on the eyes to read longer paragraphs). In Fluid I wanted change, and am using [PT Sans](http://www.google.com/webfonts/family?family=PT+Sans&subset=latin) for main copy, and Droid Serif for smaller serif variations. However, there’s still Helvetica Neue for the H1 headings. Just couldn’t get rid of my darling Helvetica Neue Medium ( `font-weight: 500` ). Visit [any page](http://johanbrook.com/heroes/) to view the beautiful heading font (if you don’t have Helvetica Neue Medium, the regular weight will be used instead).

## Responsive

The old left-aligned design wasn’t that flexible when building responsive styles. Looking at my Google Analytics stats (and the web in general) it’s clear that mobile devices **are** the future, and refusing to adapt to that equals doom. This site is completely fluid and responsive, try resize the browser window, and I’m quite happy with the result. The most important part is to completely switch over to percentage values in the CSS. Pixels are non-fluid and too absolute. If you think it’s tedious calculating percentage values for all elements, use a CSS preprocessing tool instead (like [Sass](http://sass-lang.com) – it’ll help you with some more dynamic CSS).

The design accomodates sizes for desktops, tablets, and mobiles (both in landscape and portrait mode). Go try it out.

## Markup, CSS, Javascript and more

The markup is HTML5 (“sort of valid”, with the exception for the OpenGraph meta tags I’m using in the header: [Validation results for Johanbrook.com](http://validator.nu/?doc=http%3A%2F%2Fjohanbrook.com%2F)). CSS3 is used for styling, and I’ve embedded hCards and used ARIA roles for accessibility. Looks good in Chrome, Safari, Firefox, Opera (I have yet to test in IE – not that much of priority for this site).

A quite fun thing are the CSS animations on the [homepage](http://johanbrook.com) and [About page](http://johanbrook.com/about). Nice, subtly and degrades gracefully. The fade-in on the About page only runs once per session with the help from sessionStorage, so you won’t be annoyed with having to see the animation every time you view the About page.

I've also created a [Humans.txt](http://humanstxt.org) file for the site. [Check it out here.](http://johanbrook.com/humans.txt)

### Feeds
For anyone who wants to subscribe to this site, please visit [http://johanbrook.com/feed](http://johanbrook.com/feed) for all posts. Feeds per topic are available by appending '/feed' to the topic permalink ( [http://johanbrook.com/topic/minimalism/_feed/_](http://johanbrook.com/topic/minimalism/feed/) for instance).
### Javascript

There are not too many things going on here – just some small pieces of script doing this and that, in [fluid.js](http://johanbrook.com/site/wp-content/themes/fluid/static/js/fluid.js). I’m using the superb [Hashgrid](http://hashgrid.com) for showing different grids as overlays on the site. Press and hold the G key on your keyboard to view the basic six column grid. Pin it with the H key and cycle through more grids with the J key. Pretty neat.

Apart from that, there’s just this Ajax thing I’m doing in the sidebar to show the latest song I’ve listened to. I’m pulling the data from Last.fm with a PHP proxy, formatting it as nice JSON, and put it in the page with a Mustache template (with [ICanHaz.js](icanhazjs.com)). You can also tell when I'm listening to a song with the pulsating (CSS3 animation) speaker icon just below.

**As a matter of fact,** there's a quite cool thing I'm doing in a single post view when reading on an iPad. Swiping left or right on an article will slide the text out and take you to the next or previous article. How awesome is that? Check it out. I'll probably write about it in a post soon.

All Javascript is concatenated into a single file with [Sprockets](http://getsprockets.org/) and minified with Uglify.js. I do this with a Rake task.

* * *

## Challenges

I hate designing for myself. I’m never happy. I hate to balance between showing off crazy web design skills or going minimal. I hate to kill my darlings in the pursuit of perfection. I hate to look at other web designers’ personal sites and be depressed over their beauty. So I stopped doing all that. I went my own way, promising myself that nothing is set in stone – I’ll do another redesign when I’m inspired. There’s no need for perfection (I’m not even sure perfection is achieveable by us) – just creating great things is what matters.

I like this design though. It’ll be flexible enough to evolve nicely. If you got down this far; thank for reading this! I appreciate it. Don’t hesitate to contact me with issues or questions.
