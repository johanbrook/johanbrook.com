---
title: Now
layout: layouts/page.njk
date: 2024-12-30
location: a café in Cape Town, South Africa
ogImage: /assets/images/johan-map.png
description: This page reflects what I'm doing with my life at the moment.
keywords:
    - life
    - now
    - plan
    - travels
menu:
    visible: true
    order: 2
    top: true
templateEngine: njk,md
---

Updated <time datetime="{{ date | tdate('Machine') }}">{{ date | tdate('HumanDate') }}</time> from {{ location }}.

# Moved to Cape town (temporarily)

We've always wanted to live abroad for "a while" before the oldest daughter is of mandatory school
age in Sweden. Cape Town sailed up our Top 3 location list, and then became #1. The reasons we and other people go here over the northern hemisphere winter are:

1. Roughly same timezone as Europe.
2. Great climate.
3. People speak English.
4. Interesting history and amazing nature.
5. Great food and wine.

We've been here since late September, and have got into nice routines. We've found new and old friends (people are generally super lovely and inviting), and are generally enjoying the start of South African summer.

# Travelling

We've done some weekend trips to **Franschhoek**, **Riebeek-Kasteel**, and **Stanford**. Then there are a ton of wine estates 30-60 min away. The killer is that most have playgrounds by the restaurant areas, so "everybody can have fun".

In January, we plan on going to **Paternoster** and later **Churchhaven** in Februrary.

# Exercising

The jogging along the promenade and Atlantic seaboard are *amazing* here. We live in Bantry Bay area, and I ususally sun south towards Camps Bay. When the Twelve Apostles — a chain of twelve peaks above Camps Bay — are appearing just in front of you, it's hard to not pause a little bit.

I've also found a good gym nearby, so I can still lift weights.

# Family

Edda is four now, and Freja is a bit over 1,5 years. Edda's English is really cool now, having been in preschool here for a while as well as interacting with other locals. She can piece together sentences and throws in Swedish words when she doesn't know the English term. Fearless! Freja is tagging along her sister in all kinds of ways, good and bad. They play well together, but also fight!

Suffice to say, we don't really miss the cold and slush winter in Stockholm, Sweden. South Africa for sure has its downsides for families (thousands of tiny paper cuts), but overall we _love_ the way of life here.

# Currently reading

Haven't felt the urge to read too much lately. I was so inspired by [Derek Sivers' list of books](https://sive.rs/book) though, so I might pick up something from there.

{% set book = currentBook() %}
{% if book %}
    I'm currently reading **[{{ book.title }}](/reading/{{ book.slug }})**.
{% endif %}

***

If my life changes, I'll update this page. Also see [what's on my mind](/micro).

Inspired by [Derek Sivers](https://sivers.org/now).
