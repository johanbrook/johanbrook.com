---
title: 'Linked List style posts in Wordpress'
date: 2010-10-27
tags:
    - dev
category: Wordpress
slug: linked-list-style-posts-in-wordpress
---

**Quite a few people** use this style of quick links or short posts (myself included). Daring
Fireball, Shawn Blanc and others. When linking to an article of site, the post heading itself
becomes the link. It's quite good usability and UX, and is not that hard to re-create in Wordpress.

When I attach links to my custom post type for short posts, Quickies, I use custom fields in
Wordpress. I've got two fields for link: "Link" and "Link Name". The "Link" field contains the URL
and is the important one here. In the post template (in my case `single-quickie.php` you can get the
custom field with this:

    $meta_link = get_post_meta(get_the_ID(), "Link", true);

Where "Link" is the custom field name. After that, it's just a matter of inserting it in the post's
heading tag:

    <h1>
       <?php if($meta_link):?>
          <a title="follow link" href="<?php echo $meta_link;?>"> <?php the_title();?> ›</a>
       <?php else: ?>
          <?php the_title();?>
       <?php endif;?>
    </h1>

There we go. If there's a link attached to the post, create an `<a>` element for it inside the
heading. But how do we work this out for RSS readers? Many people (myself included again) usually
read posts directly from within the reader, and Wordpress automatically makes the RSS heading link
point to the post's permalink – not our custom link. Check it out next time you're reading a Daring
Fireball linked post: when you click on the main heading you're instantly taken to the link he's
talking about. How to create this in Wordpress? I first tried to hack the RSS file, `feed-rss2.php`
but that's seldom a good thing. You should leave the core files alone. Instead, you can filter the
template tag for outputting the RSS heading in your `functions.php` :

    function johan_permalink_rss($content) {
       global $wp_query;
       $postid = $wp_query->post->ID;
       $link = get_post_meta($postid, 'Link', true);

       if(is_feed()) {
          if($link !== '') {
             $content = $link;
          } else {
             $content = get_permalink($postid);
          }
       }

       return $content;
    }

    add_filter('the_permalink_rss', 'johan_permalink_rss');

As you can see it creates a function with the original content in the parameter. It finds the
current post's id and the attached link. If it's a feed and if it's a link attached, go ahead and
make the RSS permalink ( `$content` ) the value of the custom link. Return the value and add a
filter for the `the_permalink_rss` used in Wordpress' RSS parsing file.

Not that hard, right?
