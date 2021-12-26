---
title: 'Digital magazines and HTML'
date: 2011-04-06
keywords:
    - Cocoa
    - Framework
    - HTML
    - iPad
    - Javascript
    - Magazines
    - Tool
category: Frameworks
slug: digital-magazines-and-html
---

Not too long after the original iPad was announced, the device was predicted to be the savior of magazines. Made by Apple, at least it wasn't going to be a (huge) flop. A couple of months into the raging campaign of the iPad vs. the rest of the (newly assembled) tablet manufacturer crowd, it's clear that the former is a hit. But what about magazines? There's been quite a boom on the digital magazine front – large and small publishers have pushed issues out on the App Store, or via publishing platforms like Qiozk, Paperton and Mag+. But there hasn't been any "Wow"-effect. Many of the magazines consists of static images (!) made "interactive" with flashy animations and layer effects.

## Requirements for a basic iPad magazine/news app
Peter Esse, editor at the Swedish Mac site Allt om Mac, has constructed this list of requirements for magazine/news apps in [his article](http://alltommac.se/artiklar/tidningsapparna-ett-han-mot-lasarna/):
- Clear and simple navigation. Swipe right to go to next article, swipe down to continue read the current article.
- The text must be readable on the iPad screen, i.e. the right size, but the reader should still be able to resize the font size.
- Articles must the searchable, text selectable, and there should be some kind of system for looking up unknown words and phrases in the text.
- Share articles with others, and save them for later. Note: hello, Instapaper!
- Photos and video should be able to be resized.
- Headings on the front cover and table of contents should be hyperlinked to the relevant article.
- The price should be reasonable.
- The issue shouldn't take forever to buy/download. A newspaper has to be able to download well in the middle of nowhere.
- Simple and slick to use. Minimal amount of loading screens.
- The digital version mustn't feel like a secondary spinoff to the paper issue.

(translated to English by me) Some of these requirements may be subjective, but the list sets a good starting point. The thing is, publishers can't expect savvy customers to pay a relatively great deal of money for magazines where the content just is static images! I highly recommend reading Oliver Reichenstein's article about the Wired iPad app: ["WIRED on iPad: Just like a Paper Tiger ... "](http://www.informationarchitects.jp/en/wired-on-ipad-just-like-a-paper-tiger/). He brings up fundamental typographic errors, as well as strange behaviors and interaction mistakes. While I'm at it I should make sure to link to Khoi Vinh's series of iPad magazine articles:  [http://bit.ly/gSVtmY](http://bit.ly/gSVtmY). Very thoughtful from a guy who knows what he's talking about.
## The best of both worlds
The problem, as I see it, with magazine production for tablets is that the sides are switched. Web designers are expected to create magazine layouts, and print designers are suddenly finding themselves producing issues for digital devices. The ultimate magazine would utilize the best of these two camps, in a native wrapper. But there's a third camp: the native Cocoa camp. I'm one of those who think you should create applications with native tools for the platform you're targeting. That means no Flash/Javascript-to-Objective C compilers. It just doesn't feel right in the end. Web frameworks like Sencha Touch mimics native UI pretty well, and you could pull off pretty awesome stuff with HTML5's Javascript APIs, but it's nowhere near the sophistication of Apple's native APIs – both performance wise and when it comes to user experience. ![](http://213.185.255.138/core/wp-content/uploads/2011/04/background2x-644x419.jpg "Push Pop Press") [Push Pop Press](http://www.pushpoppress.com/) is an upcoming book publishing tool (?) exclusively for the iPad. Behind the project are former Apple designers and engineers, and [John Grubers loves the demo he was shown](http://daringfireball.net/2011/02/push_pop_press). Books are said to be smooth, beautiful and slick. Pure, raw, native code. As there are no details about Push Pop Press yet, I can't speculate further about it, except for the fact that it looks really promising.
## A tool
We need some sort of tool/framework, in which we're able to use the styling capabilities of HTML and CSS together with the native effects and performance of Cocoa. A perfect mix of them both, built on a solid framework for producing the HTML and CSS rapidly, would do great I think. Especially the HTML and CSS part could actually borrow a lot of philosophies from how InDesign works. Writing markup and styles by hand is quite a process – imagine writing it all over again for each new issue. Generating markup directly from InDesign is a bad idea – I don't ever trust generated code – but we still need to produce each issue in a fairly rapid manor. I'm just thinking out loud, but a flexible base grid and an extensive set of CSS helper classes ought to do it. Issues could be easily distributed in packages of HTML, CSS and JS code, and managed by a branded "mother app" on the iPad, where you're able to purchase and manage issues. Personally I dislike the idea of having separate apps for each issue: it just doesn't make sense. I want to manage all the issues of a magazine subscription in a single "mother app" – not in one of the iPad's homescreens.
## Existing tools
  [Bonnier's Mag+](http://magplus.com) tools were released to the public for a couple of days ago – free for anyone to download and use. I downloaded the package and checked it out; it's a nice initiative and well documented. It's basically an InDesign plugin, an Adobe AIR production tool and an iPad review app, along with InDesign templates. I like the project's overall attitude, but it's not optimal. The InDesign plugin still generates static images (the Popular Science magazine was built using Mag+) and you have to publish through Bonnier's platform (which will cost you $2,500 for the first five months, then $500 per issue or month). [Treesaver](http://treesaverjs.com/) is a pure Javascript framework for "creating magazine-style layouts using standards-compliant HTML and CSS". Again: it's a great initiative. The way you structure the markup is quite alright, and I like how the magazine columns are created (text is able to flow through several columns, through several pages). However, the swiping is a bit awkward and non-native, and one of the demos crashed in iPad's Safari a few times = a pure web solution won't work performance wise and experience wise. Using these Javascript "substitutes" which are mimicking native functionality still doesn't feel 100% right. [Baker](http://bakerframework.com/) is built for packaging eBooks in an iPad app for release on the App Store. You create the book with web technologies, package it in the HPub format, then create a native app for it with the included Xcode project template. Really easy, straight-forward, and open. But I'm afraid this is meant primarily for books to be read as standalone apps – not vivid, rich magazines. [Flipboard](http://flipboard.com/) is not really a tool nor framework, but it's a great app and concept. To me, they got everything right in regards to typography, performance, readability, user experience, et al. I can spend hours just reading, reading, reading stuff I would never had read on a computer display – still, the stories live in the same RSS stream of mine! And on top of that, I don't even have to find the content myself – I'll just check out one of the built-in channels and I'm fed with fresh, new content. Flipboard captures the newspaper feel, but never really gets in my way. Along with a great grid (which rotates seamlessly on an iPad orientation change) Flipboard is the number one app for the iPad. A fusion of these kind of projects would be my dream tool:
- Use the flexibility of web technologies
- Use the power of native Cocoa frameworks to follow Apple's HIG
- Provide an easy way to brand the native app
- Be able to quickly produce clean, semantic HTML
- Use a library of flexible CSS classes to provide art direction to the issue, and be able to painlessly reorder the layout if things change.
- Blur the lines between web and native – use them together (like Flipboard does with WebViews here and there)

Magazines on the iPad could be really great. Just don't screw it up with incompetence, greed or lack of plain common knowledge.
