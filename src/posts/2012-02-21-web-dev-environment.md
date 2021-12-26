---
title: 'How I set up my web development environment on OS X Lion'
date: 2012-02-21
keywords:
    - Compass
    - Git
    - Javascript
    - 'Mac OS X'
    - Ruby
    - SCSS
    - 'Web development'
    - Node.js
    - setup
    - Homebrew
    - UNIX
    - bash
    - install
category: Development
slug: how-i-set-up-my-web-development-environment-on-os-x-lion
---

I recently wiped my Macbook Pro's hard drive and installed OS X Lion. It was nice with a clean, fresh start again, and I had for a couple of weeks looked forward to set up my dev environment from the ground up (nerd alert). Ever since I got my Mac, things had been piling up, and it felt very fragile. So this time I did everything right. During my journeys through the internets I picked up nifty tools and techniques, as well as other blog posts describing pitfalls and other general tips. Google around for something like _"setting up web development environment os x". _Two gems are [Setting Up a Ruby Development Machine From Scratch With OS X Lion](http://intridea.com/2011/7/26/setting-up-ruby-dev-on-lion?blog=company) and [Setting Up an Apple Mac for Ruby Development](http://www.stuartellis.eu/articles/mac-setup/) (just skip the parts about RVM, I'll get to that further down). I also made a list of every technology/tool/language I needed: [Johan's Checklist](http://cl.ly/CpSu) They are ordered by importance and dependency.

## Xcode or the GCC/LLVM compilers
Compilers are vital if you need to build dev tools and/or languages. Both you and I would like to do that. Some time ago, the only way to get the GCC and LLVM compilers up and running on a Mac was through Xcode. If you're a web developer, chances are big that you won't touch Xcode.app at all, and on top of that the installation footprint is quite large. Then a smart guy came along and made GCC/LLVM/other important tools available as standalone files, and put it up on GitHub!
- [osx-gcc-installer on GitHub](https://github.com/kennethreitz/osx-gcc-installer)
- [Blog post](http://www.kennethreitz.com/xcode-gcc-and-homebrew.html)

The instructions on GitHub is all you need to set it up. However, I decided to download and install Xcode 4 anyway, since I suspected I likely wanted to deal with building iOS apps later on.
## Homebrew

[The awesome package manager for OS X](http://mxcl.github.com/homebrew/). **Don’t** go dabble with installing tools manually, go through Homebrew. You can pull of stuff like `brew install mysql` or `brew install git` without having to download tarballs, building, managing binaries on the `PATH` , and … arrgghhh.

To get Homebrew started:

    $ /usr/bin/ruby -e "$(curl -fsSL https://raw.github.com/gist/323731)"
    $ brew update

Get to know the tool with the bin command `brew` .

## git

    $ brew install git

That is all. My .gitconfig is included in my dotfiles (linked further down).

## Ruby

Ruby is a must-have, with all its great gems (Sass! Compass! Sinatra! Rake!). Ruby is indeed included in OS X, but we want to manage versions ourselves and stay up to date. You could download and build Ruby from the [website](http://www.ruby-lang.org/en/), but instead I used a Ruby version manager to do it for me.

I used [RVM](https://rvm.beginrescueend.com/ "Ruby Version Manager") before, and it worked well. However, Sam Stephenson convinced me to switch to his tool **rbenv**. Read more in the [rbenv Readme](https://github.com/sstephenson/rbenv#readme). rbenv works just like RVM, but feels more lightweight.

Everything you need to know is explained in the Readme. Note that you’ll need **ruby-build** to actually build the Ruby versions ( [GitHub project](https://github.com/sstephenson/ruby-build)).

    $ brew install rbenv
    $ brew install ruby-build
    
    # Install Ruby 1.9.3
    $ rbenv install 1.9.3-p0
    
    # Check that everything works
    $ ruby -v
    ruby 1.9.3p0 (2011-10-30 revision 33570) [x86_64-darwin11.2.0]

## RubyGems

[RubyGems](http://rubygems.org/) manages all Ruby gems, and is included in OS X. But remember to update it to the latest version before you do anything.

    $ gem update --system

Then I installed some handy gems.

    $ gem update rake
    $ gem update rails
    $ gem install rack
    $ gem install sass
    $ gem install compass
    $ gem install sinatra
    $ gem install bundler

## Other

If there’s anything else you need, it’s probably in Homebrew:

    $ brew install wget mysql node mongodb
    
    # NPM
    $ curl http://npmjs.org/install.sh | sh

And [MAMP](http://www.mamp.info/en/index.html) for local PHP/MySQL development in an .app.

## Dotfiles

I’ve forked some neat dotfiles to keep in the home folder. You can find them in [my GitHub project](https://github.com/johanbrook/dotfiles). Just do:

    $ git clone git://github.com/johanbrook/dotfiles.git
    $ rake install

The dotfiles include:

- gitignore
- gitconfig (with aliases and settings)
- custom bash prompt
- git and Rake completion scripts
- irbrc (for irb)
- railsrc
- gemrc

[ ![Terminal Bright](http://f.cl.ly/items/1m1R3T160U1J361w3U3K/Terminal%20Bright.png "Terminal Bright") ](http://f.cl.ly/items/1m1R3T160U1J361w3U3K/Terminal%20Bright.png) My bash prompt and Terminal colour theme.
## Outro

And there we go! We’re done! Wasn’t so bad, eh? I suppose you can put an enormous amount of hours into configuring your setup, but this is enough for me. It’s a solid foundation with few unnecessary dependencies, which is important to me.

Don’t hesitate to give me shout if anything is wrong, outdated, or simply suck.
