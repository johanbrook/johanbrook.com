---
title: 'Native style momentum scrolling to arrive in iOS 5'
date: 2011-06-25
keywords:
    - Apple
    - iOS5
    - momentum
    - native
    - Safari
    - scrolling
    - 'Web apps'
    - Webkit
category: Browsers
slug: native-style-momentum-scrolling-to-arrive-in-ios-5
---

One of the biggest gripes of web apps in Mobile Safari comes to an end. In iOS 5 Beta 2, you are
able to do this on an element with CSS:

    overflow: scroll;
    -webkit-overflow-scrolling: touch;

[Quick demo](http://playground.johanbrook.com/css/touchtest.html) requires iOS 5.0

And the content inside that element should get native style momentum scroll. Just like any other app
in iOS.

This is huge for web apps. No more custom Javascript to fake the native behavior, like
[iScroll](http://cubiq.org/iscroll) and lately
[Scrollability](https://github.com/joehewitt/scrollability/) from Joe Hewitt. Even Apple has written
their own internal web framework ("PastryKit") to patch up things like scrolling and fixed
positioned elements. Scrollability is the best fake-native scrolling I've seen so far, and the one
in apps built with [Sencha Touch](http://www.sencha.com/) is pretty sharp as well, but I don't think
they can beat this alternative provided by Apple.

There's indeed a noticeable difference in momentum between scrolling in native apps and in web
pages. It's maybe the one single thing that makes you think: "Oh right, this is a web app". I guess
iOS has a different scrolling behavior in web pages since it's actually helpful when there's a lot
of tiny information on screen – a fast moving scroll would have been quite tricky to handle when
precision-scrolling through long news articles. But for those who really want to create apps for the
mobile browser with that native look-and-feel, this behavior is an obstacle.

Together with the previously revealed properties in Mobile Safari in iOS5, `position: fixed` and
`overflow: scroll` , this is great news for web apps. Can't wait to test this.

Note: this is the second beta, and it's never dead certain that these features actually will arrive
in the final version of the OS.
