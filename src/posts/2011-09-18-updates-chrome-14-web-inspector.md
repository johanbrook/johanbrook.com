---
title: 'Subtle updates to Chrome 14''s Web Inspector'
date: 2011-09-18
keywords:
    - active
    - Chrome
    - CSS
    - Debugging
    - Google
    - hover
    - States
    - 'Web Inspector'
    - Webkit
category: Browsers
slug: subtle-updates-to-chrome-14s-web-inspector
---

[Chrome 14](http://chrome.blogspot.com/2011/09/new-stable-release-of-chrome-expanding.html) landed
in the stable channel some days ago, and brings some better OS X Lion support, as well as a Web
Audio API and "Native Client" (run C/C++ code in the browser). I also noticed a difference in the
Web Inspector. I don't think this have been here in previous stable builds. In the _Elements_ tab,
to the right, two new buttons are added:

- A plus sign for adding a new style rule (previously in the cog wheel menu)
- A "Toggle Element State" button

![Web Inspector](http://cl.ly/ACmO/no-hover.png) ![Web Inspector](http://cl.ly/AD54/with-hover.png)
The "Toggle Element State" button is interesting, and useful: **it lets you activate different
states for an element**, such as `:hover` , `:active` , `:active` , `:visited` and `:focus` .
Before, it was nearly impossible to view the styles when hovering over an element, for instance. Now
we can activate the different states and debug easily. Neat and subtle addition.
