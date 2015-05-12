---
title: 'Dustin Diaz''s $script.js'
link: 'http://www.dustindiaz.com/scriptjs/'
date: '2011-02-20 11:37'
tags:
  - $script
  - Asynchronous
  - 'Dustin Diaz'
  - Javascript
category: Javascript
---

The Javascript ninja [Dustin Diaz](http://twitter.com/ded) of Twitter has created a very, very minimal solution for loading Javascript files asynchronously as well with dependencies.

    $script('analytics.js');
    $script('library.js', function() {
      // do stuff with library.
    });
Not too hard to grasp. Import `library.js` , use it in the code. For the jQuery fans:

    $script('jquery.js', 'jquery');
    
    $script.ready('jquery', function() {
      // do stuff with jQuery
    });
It seems you're able to do some pretty neat stuff with it:

    new school - loads as non-blocking, and ALL js files load asynchronously
    $script('jquery.js', 'jquery');
    $script('my-jquery-plugin.js', 'plugin');
    $script('my-app-that-uses-plugin.js');
    
    /*--- in my-jquery-plugin.js ---*/
    $script.ready('jquery', function() {
      // plugin code...
    });
    
    /*--- in my-app-that-uses-plugin.js ---*/
    $script.ready('plugin', function() {
      // use your plugin :)
    });
It adds a little bit more control over the browser loading process, and as a bonus it doesn't block the downloading of images and other documents. Check out the [blog post](http://www.dustindiaz.com/scriptjs/) or [follow the project](https://github.com/polvero/script.js) on Github.
