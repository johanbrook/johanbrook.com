---
title: 'Staying hungry and evolving with new technologies'
date: '2011-06-22 07:00'
tags:
    - Compass
    - Git
    - GitHub
    - Rake
    - Ruby
    - Sass
category: Development
slug: staying-hungry-and-evolving-with-new-technologies
---

![[Flower]](http://farm4.static.flickr.com/3231/2975202054_a95eff9abd_z.jpg) Photo by [Bruce](http://www.flickr.com/photos/irschick/2975202054/)

When working with the World Wide Web it's vital to keep up with changes and learn new things. Call it "survival of the fittest" or whatever, but it doesn't hurt to throw a glance at some blog posts about new technologies on the web once in a while. And sometimes, one technology is just a gateway to a myriad of other things: I've experienced precisely that during the past year.

I’ve never believed the lines between a designer and developer should be that sharp. Instead I think you should [fatten up your T’s](http://jnbrk.se/g7S1Fp) and always expand your knowledge a little bit outside of the borders of your current field. It’s both a respect and co-operation thing: imagine if you had NO idea of what your team-mate is doing all day long. Mutual understanding of each others’ tasks help problem solving.

I’m a designer by heart but a developer by brain (don’t know if that’s correct English though). During the past year I’ve been exposed to a really exciting developer world where lots of super-clever people put their heads together to solve a problem. What follows is a summary of some technologies which have in a way changed the way I design and develop.

## Sass

[Sass](http://sass-lang.com) is everything CSS isn’t. CSS3 is great and all, but it’s still a rather dumb language. It’s not dynamic, it’s not encouraging re-use and modularity. Even stylesheets for semi-small sites tend to be huge and bloated – frustrating to work with – since we have to build for many browsers, environments, and devices. I started out with Sass thinking “hey, this is pretty cool. Variables, mixins and stuff. This will be handy”. Actually, it’s been more than handy. I’d have a hard time going back to regular CSS again. I’ve built [some](https://github.com/johanbrook/Johan-Compass-Kit) [stuff](https://github.com/johanbrook/dyluni) with Sass as well.

With Sass you’re able to pull off stuff like:

    $color: red;
    
    nav{
        background: $color;
    
        li {
            float: left;
        }
    
        a {
            color: #fff;
            background: darken($color, 10%);
        }
    }

Nesting and variables in action. Incredibly useful, but it’s just the tip of the iceberg. When Sass feels right for you, be sure to check out [Compass](http://compass-style.org) – a framework which is doing all the boring stuff for you.

I really, really, really recommend checking out Sass. It’s super easy to get started with and won’t add problems for other people working with your stylesheets.

## Ruby

If we’re talking about Sass, we have to mention Ruby. Ruby is a programming language originally from Japan, actually created around the same time as PHP. The goals with Ruby were to be more powerful than Perl and more object-oriented than Python. I’ve been reading about it on and off during a couple of years, but it’s never really stuck (I blame the regular “lack of time”). I think it’s because I’ve never been forced to use it: I studied Java and PHP in school (uhh … ) and of course HTML/CSS and Javascript.

I’m attracted to Ruby thanks to its simplicity and non-bloat. Generally it’s amusingly easy and in the same time incredibly hard to write clean, simple and clear code, but I’d say Ruby encourages and helps you more than, say, PHP.

For me, the “Ruby way” is crystallized in this code:

    5.times do |number|
        puts "Number is #{number}"
    end

It’s object-oriented ( `5.times` ? Craziness!). It’s human-readable at first glance.

Or in this:

    name, other_name = "Johan", "John"
    
    puts "Oops, the name isn't #{other_name}" unless name == other_name

See that? _Readable_.

## Rails and Sinatra

[Ruby on Rails](http://rubyonrails.org/) is a web framework written in Ruby. It’s MVC, got a nice ORM, and lets you stop repeating yourself, and get more stuff done. [Sinatra](http://www.sinatrarb.com) is also a Ruby web framework, but more lightweight than Rails – stripped on everything you might not need for micro apps. I haven’t worked too much with any of these (yet) but I like their approach and philosophy. Every file in its place.

## Git

[Git](http://git-scm.com/) is a version control system (developed by Linus Torvalds, creator of Linux) which actually has changed the way I work with code. When using Git I get local revision tracking, with the ability to experiment with new ideas in different branches and later on merge them. Co-operation with others is a piece of cake. I’m able to publish projects to my [GitHub account](https://github.com/johanbrook). It’s possible to deploy whole projects to cloud platforms such as [Heroku](http://heroku.com/) and [PHP Fog](https://www.phpfog.com/) from the command line (“I assume you’re able to see yourself out, FTP?”).

Git is truly wonderful. Designers: don’t fear the command line! When working with others in a fairly large project, it’s essential to have some sort of version control anyway, and there are even great [GUI apps](http://www.git-tower.com/) for Git if you want to see what you’re doing. I recommend [Git Immersion](http://gitimmersion.com/) as a nice, well-designed introduction in a clear language for humans.

### GitHub

I mentioned [GitHub](http://github.com) above. GitHub is sort of a social network for programmers (not the cheesy type of network though). It’s dead simple to publish your projects, add code, bring in other peoples code, discuss, hunt bugs, view diffs, and much more. I discover new features in GitHub every day it seems. It’s also a great place for learning: the best way to learn a new language, framework or tool is to actually study raw code. I’ve learnt **a lot** about best practices and conventions from studying other people’s code.

Some of the web’s largest open source projects are on GitHub:

- [jQuery](https://github.com/jquery/jquery)
- [Ruby on Rails](https://github.com/rails/rails)
- [Modernizr](https://github.com/Modernizr/Modernizr)
- [HTML5 Boilerplate](https://github.com/paulirish/html5-boilerplate)
- [Django](https://github.com/django/django)
- [Node.js](https://github.com/joyent/node)

Free for anyone to clone, fork, and collaborate on. View more cool stuff at [Explore GitHub](https://github.com/explore)

## Rake

Finding yourself doing the same things over and over again during the course of a project? It might be compiling Sass, minifying and concatenating Javascript, or other boring stuff. With [Rake](http://rake.rubyforge.org/) (“Ruby Make”) it’s possible to write _tasks_ in Ruby, where lots of stuff can be done.

For example, this tasks compiles my Compass project in production mode:

    require "rake"
    
    desc "Make sure the master Sass file is compiled for production"
    task :sass do
        puts `compass compile -e production --force`
        puts "* Sass compiled to 'style.css'"
    end

I invoke this task from the command line with

    $ rake sass

I can write a couple of boring tasks like this:

    require "rake"
    
    desc "Build site"
    task :build => [:concat, :minify, :sass] do
    end
    
    desc "Concatenate Javascript"
    task :concat do
        # Use Sprockets (http://getsprockets.org/) or some other tool for concatenating the files
    
        puts "* Mashed together all JS files into all.js"
    end
    
    desc "Minify the Javascript"
    task :minify do
        # Use a minifier such as UglifyJS, Uglifier, or Google Closure Compiler
        # to compress the Javascript
    
        puts "* Minified source"
    end
    
    desc "Make sure the master Sass file is compiled for production"
    task :sass do
        puts `compass compile -e production --force`
        puts "* Sass compiled to 'style.css'"
    end

And run the `:build` task from the command line:

    $ rake build

… and all of the above are executed. Actually, it’s not even required to have a `:build` task: instead specify a default task like this:

    task :default => [:concat, :minify, :sass]

Now those three tasks will be executed whenever you run `rake` (without anything else) in the command prompt.

I learned the basics of Rake from googling around for tutorials, and I encourage you to do the same. [This is an excellent walkthrough](http://jasonseifer.com/2010/04/06/rake-tutorial) of the features you most likely will use on an everyday basis.

## RubyGems and Node Package Manager

Remembered when code libraries where distributed in zip files? Download, unzip, place in a `library` directory, keep track of new versions. Nah, things could work better. [RubyGems](http://rubygems.org/) is a command line utility which makes this a breeze. Each library (or package of code) is a _gem_. You install gems by typing

    $ gem install <name>

Simple, simple, simple. Wanna install the latest Rails? Run `gem install rails` ( [RubyGem page](http://rubygems.org/gems/rails)). The Twitter gem? `gem install twitter` ( [RubyGem page](http://rubygems.org/gems/twitter)). It’s a superb way of distributing code. Those libraries might be used on the command line (like Sass and Compass) or in code (or both).

[Node Package Manager](http://npmjs.org/) (or “NPM”) is similar to RubyGems, but for Javascript libraries (built with Node.js). Haven’t dealt a whole lot with NPM so far, but it gets the job done.

## Outro

**Expose yourself to new technologies**. They might help you and the way you work, and not the least: expanding your knowledge, experience, and flexibility. Don’t be intimidated by unknown concepts and tools – experiment a bit.

You’ll be more attractive as well: a designer knowing his/her way around Sass, Git, and Rails templates? A godsend gift for any developer! It works the other way around too: a developer appreciating typography, colour theory, and more.

Ignorance is a sin. Stay hungry.

