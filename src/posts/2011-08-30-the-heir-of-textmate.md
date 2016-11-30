---
title: 'Chocolat – The Heir of Textmate?'
date: '2011-08-30 08:00'
tags:
    - Chocolat
    - Code
    - Editor
    - 'text editors'
    - Textmate
    - heir
    - alternative
category: Tools
slug: chocolat-the-heir-of-textmate
---

**Textmate has probably ruled** the text editor universe for some years now. There are others; Coda, Espresso, BBEdit, Vim, Emacs, etc., but they don't cut it for me personally. But Textmate is getting old. The vast number of bundles for Textmate are for some people not enough arguments for sticking by an application which hasn't had a major update for several years.

What I love with Textmate is its sense of lightweight-ness and the wide array of ways to customize the app. It boots in a second or two and then you're ready to start coding or writing. Type `mate` from the command line to open _any_ file in Textmate. You're able to customize the hell out of the app with bundles, snippets, commands, macros, themes, and more. Make it fit your needs.

This far, no other text editor has that perfect blend of great customizability and still keeps its user-friendliness (I'm no Emacs or Vim guy). It doesn't try to be a full blown IDE (like another Neatbeans, Eclipse, etc. Thank god), nor does Textmate go half the way with features I don't need (like Coda, Espresso, etc.). It's a text editor with IDE capabilities.

## An heir: Chocolat
![](http://johanbrook.com/core/wp-content/uploads/2011/08/Chocolat.png "Chocolat")

I mentioned above that Textmate is getting old. I mean: it still works, but it would feel quite ... safe if somebody would be maintaining it, actively tweaking features, and keeping it up to date in the evolving world of development. In comes [Chocolat app](http://chocolatapp.com). When I first visited the site I thought: "Yeah, another half-assed editor". But after receiving an invite to the alpha I'm completely blown away by Chocolat.

## Out with the old ... or? Chocolat's import features
![](http://johanbrook.com/core/wp-content/uploads/2011/08/Install-Extras.png "Install Extras")

Chocolat has **full Textmate bundle, snippet and theme support**. You are therefore actually able to pull in stuff from Textmate directly into Chocolat – no hassle. That weird feeling you get when you try out a new text editor (like switching shoes) is completely gone once you've pressed some buttons and imported your finely tuned Textmate theme. Chocolat's version of bundles ("Truffles") are installable from within the app, and Chocolat automatically finds local Textmate bundles and themes, and also Truffles from various GitHub repositories as well. Wicked cool. Your cozy "Bundle" navigation menu in Textmate looks exactly the same in Chocolat ("Actions").

![](http://johanbrook.com/core/wp-content/uploads/2011/08/Install-Themes.png "Install Themes")
## The interface

A text editor's interface is a huge deal. After all; it's what you stare at during the day. Chocolat looks like most other editors, but most notably Textmate. The project drawer ("Files bar") has much more visual weight in Chocolat, and includes Espresso's concept of active files in the top (instead of having all tabs for opened files at the top of the window, Chocolat and Espresso put them in an "Active" group in the sidebar). The Files Bar also looks better in Chocolat than the one in Textmate, but that's just in line with the overall nice UI work in the app. It's up-to-date OS X interface elements, and a welcomed refresh from Textmate's somewhat outdated style.

### Split panes
![](http://johanbrook.com/core/wp-content/uploads/2011/08/index.php_.png "index.php")

If you own a large widescreen monitor or just like having files line up vertically, Chocolat includes a vertical split option. Nice.

### Workspaces

Instead of making the top tab bar space designated for files, Chocolat makes the tabs symbolize work spaces. You are of course free to make the tabs to be for files as well. I'm not completely sure of what work spaces will be in Chocolat, but I guess they're for another layer of separation for your resources. For example; you could work with backend files in one work space and with front-end HTML and CSS in another. Still a bit buggy behavior when switching between work spaces though.

### Quick Open
![](http://johanbrook.com/core/wp-content/uploads/2011/08/Quick-Open.png "Quick Open")

When a friend showed me Textmate's "Go To File" feature (CMD + T) I was stuck. No more looking in the file browser for files – just hit the keyboard shortcut and search. Fast switching between files is a joy since the Go To File dialog remembers the files you've recently opened.

Chocolat also incorporates this with its Quick Open. It's another keyboard shortcut (CMD + D) but works the same way: type and hit Enter. However, the Quick Open dialog doesn't keep the recently opened files, which is a bummer (discussed in [this bug tracker thread on GitHub](https://github.com/fileability/chocolat-public/issues/170)).

## CLI tool

As I mentioned, it's sooo cool to be able to type `mate <file>` in Terminal and open a file or folder in Textmate. Chocolat also ships with a CLI tool (which you explicitly have to install from "Chocolat > Install Command Line Tool ..."). Works the same way:

    $ choc <file>

Another check in the list.

## Summary
![](http://johanbrook.com/core/wp-content/uploads/2011/08/Themes.png "Themes")

Chocolat is really cool. It takes the best from Textmate and mix it with modern Cocoa and some nifty ideas. I truly hope the people behind it will continue develop it. Suggestions from the community is welcomed, and I believe the development process is quite transparent.

  

## IT'S AN ALPHA!

Don't flame on the app for being in alpha. The developers themselves have stated that they're adding a bunch of features in the alpha stage and then focus on stability in beta (sort of the other way around compared to other software projects). I got this totally wrong; of course it's the other way around. From the [Chocolat blog](http://chocolatapp.com/blog/):

>  We're doing Chocolat's development "backwards", so in the Alpha we're fixing bugs, and in the Beta we'll add extra features. We want a solid and usable text editor before we start adding a bunch of extra features.  Thanks to Tim Mackey for pointing this out.
The app could be quite choppy when there's lots of code and files. I've experienced some scroll lag and delay when using Quick Open once in a while.

If you have something to report, please visit the official [GitHub bug tracker repo](https://github.com/fileability/chocolat-public).

(I was testing version 0.0.32 when this post was written)
