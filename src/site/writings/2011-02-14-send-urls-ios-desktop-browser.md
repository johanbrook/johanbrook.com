---
title: 'Send URLs from iOS to desktop browser'
link: 'http://www.macstories.net/tutorials/how-to-send-any-webpage-from-ios-to-your-mac-browser/'
date: '2011-02-14T19:51'
keywords:
    - Automator
    - Browser
    - Dropbox
    - Ruby
    - URL
category: Minimalism
slug: send-urls-from-ios-to-desktop-browser
---

Sometimes while browsing the web in Mobile Safari you might find yourself wanting to view the current site in your desktop browser. We all know it's tedious, boring and plain wrong to type in the URL from the Mobile Safari window into the desktop browser's address field, so of course someone has come up with a solution for this. Well, many solutions. I hear from other people that Tapbots' [Pastebot](http://tapbots.com/software/pastebot/) works great, but this means you've got to go through a third party app. Not everybody want that. So of course there's a quick, hacky and dirty solution to the problem, which uses nothing but native OS X/iOS technologies and the amazing Dropbox as always (as well as a free web service). Check out the link above for the complete guide. In short: connect your Dropbox to the free [Send to Dropbox](http://sendtodropbox.com/) service which lets you e-mail stuff to your Dropbox account (in this case the web page URL as a text file), and set up a Automator folder action which runs a Ruby script that opens the text file and put the URL in your browser window.

    ARGV.each do |f|
       file = File.new(f, "r")
       
       while (line = file.gets)
          system "open #{line}"
       end
    
       file.close
    end
It's minimal, hacky and lovely. I'll never stop being amazed over the power of Dropbox and Automator.
