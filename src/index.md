---
template: home
layout: layouts/home.njk
templateEngine: njk,md
---

I’m coding & designing, and I like working with product, user experience, and
interface design. And other things too.

I'd like to write more (don't we all), and I consume a (un)healthy amount of music.

You can reach me via [email](mailto:{{ meta.email }}) or [Mastodon]({{ '' | mastodonUrl }}).

{% if currentBook() %}
***

I'm currently [reading](/reading) “<u class="b">{{ currentBook().title }}</u>” by {{ currentBook().author }}.

{% endif %}

***

My fav track <time title="Updated at {{ current_track.updatedAt | date('yyyy-MM-dd')}}" datetime="{{ current_track.updatedAt }}">at the moment</time> is ♫ <u class="b">{{ current_track.name }}</u> by {{ current_track.artist }}.
