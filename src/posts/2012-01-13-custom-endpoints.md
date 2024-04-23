---
title: 'Adding custom URL endpoints in Wordpress'
date: 2012-01-13
tags:
    - dev
category: Wordpress
slug: adding-custom-url-endpoints-in-wordpress
---

In a current Wordpress project, we wanted to have a permalink to a photo gallery filled with images
(attachments) for a post. Wordpress supports permalinks to single attachments, such as

    site.com/single-post/attachment/flower

That's cool. However, we wanted something like this:

    site.com/single-post/photos

... where all attachments would be listed. The `/photos` part is called an _endpoint_. So how do you
add them in Wordpress? And how do you assign this endpoint to render a specific template file?

## Relevant APIs

After some quick googling to find out if this was possible and worth a try, I found the
[Rewrite API](http://codex.wordpress.org/Rewrite_API) in the Codex. Neat stuff.

Other resources I found during my quest:

- [http://johnbeales.com/20090824/endpoints-a-little-secret-for-url-manipulation-in-wordpress/](http://johnbeales.com/20090824/endpoints-a-little-secret-for-url-manipulation-in-wordpress/)
- [http://wordpress.org/support/topic/custom-rewrite-approach-with-add\_rewrite\_endpoint](http://wordpress.org/support/topic/custom-rewrite-approach-with-add_rewrite_endpoint)
- [http://www.rlmseo.com/blog/passing-get-query-string-parameters-in-wordpress-url/](http://www.rlmseo.com/blog/passing-get-query-string-parameters-in-wordpress-url/)
- [URL Design for Sub-Posts?](http://wordpress.stackexchange.com/questions/1033/url-design-for-sub-posts)
- [http://codex.wordpress.org/Template\_Hierarchy](http://codex.wordpress.org/Template_Hierarchy)

## The code

After reading through these, I simply implemented the necessary filters and callbacks in the
`functions.php` file.

I began with this:

    add_filter( 'query_vars', 'add_query_vars');

    /**
    *   Add the 'photos' query variable so Wordpress
    *   won't mangle it.
    */
    function add_query_vars($vars){
        $vars[] = "photos";
        return $vars;
    }

As you can see, I'm working with my `/photos` endpoint. I have to tell Wordpress' rewrite engine to
take our special query variable ("photos") into account when rewriting URLs, so I used the
`query_vars` filter for this (see the
[Filter Reference](http://codex.wordpress.org/Plugin_API/Filter_Reference)).

Next, I registered the actual endpoint with the built-in function `add_rewrite_endpoint()` (
[Docs](http://codex.wordpress.org/Rewrite_API/add_rewrite_endpoint)). It takes a string (the
endpoint) and a `place` . "Place" is where the endpoint will be active, and the docs only specify a
couple: "EP\_PERMALINK, EP\_PAGES, EP\_ATTACHMENT, etc". From other examples I've spotted `EP_ALL`
as well. I used `EP_PERMALINK` :

    add_rewrite_endpoint('photos', EP_PERMALINK);

Right. The endpoint is up and running, but as I said at the top, I wanted a specific template to
render when this URL is visited. It's doable! Check out the
[single\_template filter](http://codex.wordpress.org/Plugin_API/Filter_Reference/_single_template).

    add_filter( 'single_template', 'project_attachments_template' );

    /**
    *	From http://codex.wordpress.org/Template_Hierarchy
    *
    *	Adds a custom template to the query queue.
    */
    function project_attachments_template($templates = ""){
    	global $wp_query;

    	// If the 'photos' endpoint isn't appended to the URL,
    	// don't do anything and return
    	if(!isset( $wp_query->query['photos'] ))
    		return $templates;

    	// .. otherwise, go ahead and add the 'photos.php' template
    	// instead of 'single-{$type}.php'.
    	if(!is_array($templates) && !empty($templates)) {
    		$templates = locate_template(array("photos.php", $templates),false);
    	}
    	elseif(empty($templates)) {
    		$templates = locate_template("photos.php",false);
    	}
    	else {
    		$new_template = locate_template(array("photos.php"));
    		if(!empty($new_template)) array_unshift($templates,$new_template);
    	}


    	return $templates;
    }

I've hard coded the file `photos.php` above. Create this file in the theme folder, and you're all
set! In this template you've got access to the global `$post` variable, so you're able to pull in
all kinds of post data into it.

## Outro

Pretty cool to bend Wordpress to your will, eh? I can imagine this functionality is pretty nifty to
have when doing more advanced things in Wordpress.
