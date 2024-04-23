---
title: 'Minimal Skype 5 message style'
link: 'http://pongsocket.com/experiments/skype5mini'
date: 2010-11-04
tags:
    - software
category: Minimalism
slug: minimal-skype-5-message-style
---

Skype 5 Beta for Mac arrived earlier today. I like the unified one-window concept and group video
calls. But I and almost the rest of my Twitter stream think there's too much whitespace in certain
areas, the instant messaging chat, for example. The thing is, the messaging area uses Webkit and
therefore CSS to style the messages. You can change style by going to the Skype preferences >
Messaging > Style. Custom styles live in `~/Library/Application Support/Skype/ChatStyles` , and are
in the `.SkypeChatStyle` format (basically a package consisting of CSS, HTML and JS files). To the
point of this post: [Andy Graulund](http://twitter.com/graulund) has created a minimal style for
Skype 5 beta, Panamerica Mini. [Download](http://pongsocket.com/experiments/skype5mini) and put in
the folder I mentioned above, and chose the style from the Preferences.
