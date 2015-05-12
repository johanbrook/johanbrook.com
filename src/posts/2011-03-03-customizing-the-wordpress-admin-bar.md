---
title: 'Customizing the Wordpress Admin Bar'
date: '2011-03-03 08:00'
tags:
  - '3.1'
  - 'Add menu'
  - 'Admin Bar'
  - Customize
  - Functions.php
  - Hook
  - Menu
  - Wordpress
category: Wordpress
---

**Wordpress 3.1 brought us** a lot of things; an admin bar amongst others. That one's been present on hosted Wordpress.com blogs for quite some time, and available as a plugin as well. At first I deactivated the bar at once, but later I realized it's pretty handy to have around. I usually make my own admin menus for quick access to stats, new posts and more, but the official admin bar is more versatile (I'm using the Wordpress function `current_user_can("manage_options")` in an if-statement to show the admin menu only to me). ![](http://213.185.255.138/core/wp-content/uploads/2011/03/Johan-Brook-adminbar-588x166.png "Johan-Brook-adminbar") Anyway, how about customizing the admin bar? You know: add stuff, style stuff. Plugins and themes may add their own menus to the bar, as with the Wordpress.com Stats plugin I'm using, for instance. A small graph is shown in the bar if you've got the plugin installed, with a link to the admin stats page. Neat – as you see on the screenshot above it also shows the shortlink to the current page/post. The rendering of the bar itself builds upon a simple API you can hook into, but I haven't found any documentation in the Wordpress Codex yet though, so I'm gonna show some simple examples from what I've picked up from the Wordpress core. First we need a hook. The Wordpress developers advise us to use `admin_bar_menu` . Right on. Add this to `functions.php` :

    add_action("admin_bar_menu", "customize_menu");
    
    function customize_menu(){
        global $wp_admin_bar;
    
        // Do stuff
    }
The `customize_menu()` is a handler which will do stuff with the admin bar. We also need to define the global `$wp_admin_bar` variable in order to call the API functions.
## The API
The WP\_Admin\_Bar class includes the great `add_menu()` function which we use to add menus:

    $wp_admin_bar->add_menu($args);
    
    // Defaults:
    $args = array(
       "id" => false,
       "title" => false,
       "href" => false,
       "parent" => false,
       "meta" => false
    );
  `id` (String) The id of your menu. Make sure it's unique – this will identify your menu, and also be used in the menu item's `id` attribute in the HTML code like this: `<li id="wp-admin-bar-{$id}"> ... </li>` `title` (String) The title of your menu. Will be shown on the front-end. `href` (String) The URL the menu post links to. `parent` (String) The id of the parent menu, if you'd want that. `meta` (Array) Some handy extra stuff: "html", "class", "onclick", "title" and "target". Ex: `"meta" => array("onclick" => 'alert("Hi there");')` . Note: the value of "html" will be added directly after your menu item in the bar. So with these guys you could construct something like this:

    $wp_admin_bar->add_menu(array(
       "id" => "mymenu",
       "title" => "A custom menu",
       "href" => "http://google.com",
       "meta" => array("target" => "blank")
    ));
... which will produce this: ![](http://213.185.255.138/core/wp-content/uploads/2011/03/JohanBrook-CustomMenu.png "JohanBrook-CustomMenu") Neat. Now you have a custom, top-level menu item. What if you'd like to link to pages in the Wordpress admin from your menu? Check out the `admin_url()` function. Use it to link directly to any page in wp-admin, like this: `admin_url("nav-menus.php")` . Incredibly good for plugin authors.
## Dropdown menus
A menu item is cool and all, but it would be awesome to add more items and group them, like in a dropdown menu. We'll go ahead and to that with the `parent` key in the argument array. Add this below the previous code:

    $wp_admin_bar->add_menu(array(
    	"id" => "my-child-menu",
    	"title" => "Child",
    	"parent" => "mymenu"
    ));
It behaves just like any other menu, but you'll have to specify the `parent` key to the top-level menu's id. The children are automatically attached to the parent menu and shown on hover, as expected: ![](http://213.185.255.138/core/wp-content/uploads/2011/03/JohanBrook-ChildMenu.png "JohanBrook-ChildMenu")
## External data
So now it's completely up to your needs. Just use functions and variables as usual as you du in `functions.php` . For instance, just declare the global `$post` variable beside `$wp_admin_bar` and you'll have access to the current post's data:

    add_action("admin_bar_menu", "customize_menu");
    
    function customize_menu(){
    	global $wp_admin_bar, $post;
    
    	$children = get_children(array("post_parent" => $post->ID));
    
    	$wp_admin_bar->add_menu(array(
    		"id" => "mymenu",
    		"title" => "Post: " . $post->post_title,
    		"href" => "http://google.com",
    		"meta" => array("target" => 'blank')
    	));
    
    	if($children){
    		foreach($children as $c){
    			$wp_admin_bar->add_menu(array(
    				"parent" => "mymenu",
    				"title" => $c->post_title,
    				"href" => get_permalink($c->ID)
    			));
    		}
    	}
    
    }
Simple enough: _get access to `$post` => Find eventual child pages => loop through and add to parent item._ ![](http://213.185.255.138/core/wp-content/uploads/2011/03/JohanBrook-ChildPosts.png "JohanBrook-ChildPosts")
## Source
You'll find relevant source code in the files `wp-includes/class-wp-admin-bar.php` and `wp-includes/admin-bar.php` . Funny: I just realized I had switched to Chrome for the last two screenshots. You'll just have to put up with that.
