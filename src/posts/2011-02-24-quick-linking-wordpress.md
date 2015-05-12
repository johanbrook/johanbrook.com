---
title: 'Quick internal linking tag in Wordpress'
date: '2011-02-24 21:48'
tags:
  - Functions.php
  - Link
  - 'Template tag'
category: Wordpress
---

Wordpress has quite many nifty features, the vast library of template tags is one of them. One thing I've missed for a long time is a quick function to link to internal pages. Since the root URL will change if you switch domains you could absolutely not code the absolute URL by hand. You can't rely on the permalink structure you've set up on your local installation either (which means creating root relative links like `<a href="/some-page">Some page</a>` is a bad idea).  I wrote this lazy function in `functions.php` in order to quicklink to internal pages:

    function link_to($slug) {
       echo get_bloginfo("url")."/".$slug";
    }
    
    // Usage:
    <a href="<?php link_to("about");?>">About me</a>
This is a really terrible idea since it relies on having a short permalink structure set up.  To make it more dynamic, try this one out:

    function link_to($slug){
       echo get_permalink(get_id_by_slug($slug));
    }
    
    /**
    *	Returns the ID from a slug
    */
    function get_id_by_slug($page_slug) {
        $page = get_page_by_path($page_slug);
        if ($page) {
            return $page->ID;
        } else {
            return null;
        }
    }
Now, the function will look the real permalink to the page, whatever that could be.  I'm actually quite surprised that there's no native template tag or other built in feature for for linking to pages (or posts) in Wordpress, now when everybody says it's a CMS and all.
## Update, 2012-03-31
I've found the version below more reliable and flexible. Try it out instead.

    function link_to_page($page_slug, $echo = true){
    	if(is_string($page_slug))
    		$page = get_ID_by_slug($page_slug);
    	
    	if(!$page){
    		$link = get_bloginfo("url")."/".$page_slug;
    	}
    	else {
    		$link = get_permalink($page);
    	}
    
    	if($echo && $link)
    		echo $link;
    	else
    		return $link;
    }
