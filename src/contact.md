---
title: Contact
layout: layouts/page.njk
templateEngine: njk,md
menu:
  visible: true
  order: 6
---

| Method   | Value                                                     |
| -------- | --------------------------------------------------------- |
| Email    | [{{ meta.email }}](mailto:{{ meta.email }})               |
| Twitter  | [{{ meta.twitter }}](http://twitter.com/{{meta.twitter}}) |
| GitHub   | [{{ meta.github }}](http://github.com/{{meta.github}})    |
| Mastodon | [@{{ meta.mastodon.username }}@{{meta.mastodon.domain}}](http://{{meta.mastodon.instance}}/@{{meta.mastodon.username}})    |
