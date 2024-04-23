---
title: My favourite software
slug: my-favourite-software
date: 2022-02-23
location: My living room in Stockholm
excerpt: Various software I love and use a lot.
tags:
    - dev
    - software
---

## 1. Typescript

I started programming in Java and PHP. Those two worlds were vastly different. PHP stood for
freedom, fun, and anything-is-possible. Java was rigid, hard, and verbose – much because of the need
for _types_ everywhere. However, when I got the Java code to compile, it was _usually_ okay in
runtime (as okay it can be for a 15 year old). Java was heavily used in university, and I grew to
hate it even more. The interpreted languages like PHP, Ruby, and Javascript felt much nicer.

Fast forward to around 2018, and I got the chance to play around with Typescript (and GraphQL) at
work. This was a turning point in my journey as programmer: the types actually helped me. The type
system – although not as "correct" as in Haskell et al – was expressive, flexible, and quite easy to
understand. And the language itself resembled Javascript so much I didn't think about it.

What I love about Typescript is:

- the no-nonsense setup:
  ```bash
  npm i --save-dev typescript
  touch script.ts
  npx tsc script.ts
  ```
- the backwards compatibility with Javascript: one can gradually add types if that suits the
  project.
- I'm not annoyed over any particular syntax of the language.
- that it's actively maintained, and the community is growing and full of tools.

---

Typescript is probably the single piece of software that has made me write better code over the last
few years. I need less automatic tests, less or no linting. It has opened a new world (of types) to
me, and has made me never wanting to go back.

## 2. Deno

[Deno](https://deno.land) is what NodeJS was supposed to be. I think. It's a new Javascript runtime
which does a lot of things right. Peruse the Manual and if you've written a bit of NodeJS, you'll
probably find yourself nod along as you read through the Deno docs.

There are a lot of built-in things, and the ecosystem is spreading. Typescript is a first class
citizen. Testing, formatting, and linting are included. Web APIs are available on the server.

Deno fixes so many things in Node which I'd either get annoyed with or work around.

## 3. cUrl

The `curl` command just works. There are wrappers and replacements which are "simpler" and more
intuitive. But this is one of these cases where I think it's good to learn the low level tools,
since `curl` is available on a _lot_ of machines.

I for one appreciate elegant CLI tools which doesn't make me figure out their fantasy world of
options and arguments. But `curl` is such a fundamental way to interact with remote data (I use it
for HTTP 100% of the cases).

## 4. Lume

[Lume](https://lumeland.github.io) is a static site generator (using Deno and Typescript). I
recently moved to it from Eleventy, and before that from Jekyll -> Wintersmith -> Metalsmith. Lume
is the first one which is close to 100% intuitive, and the first one that I'm not annoyed over when
using. I've read some of the Lume source code, and it's lovely: succinct and readable.

Lume does what it does, and does it really well.

## 5. Numi

[Numi](https://numi.app) is a calculator app, like Soulver, which I use a couple of times per day.
I've bound it to be visible when I press `cmd+shift+x` for quick calculations. I use it for
everything from credit card bills to protein intake calculations. It's declarative in the sense that
it "does what I think it does". If I type `5% of 100g` it'll output `5 g`. It has
[nice documentation](https://github.com/nikolaeu/numi/wiki/Documentation).

Numi doesn't just to maths: it can deal with unit, timezone, and currency conversions too, and many
other things.

This tech isn't novel, but Numi pulls it off in a minimal packaging, and I love it.

## 6. Tweetbot

I honestly don't understand why people are using the regular Twitter.com or Twitter clients for
iOS/Android. People complain daily about "The Algorithm", non-chronological timelines, ads, etc.
etc. Just start using a 3rd party client already!

I've used a ton of clients since I joined Twitter. Many of them are now dead because of Twitter's
big purge (they killed a lot of API functionality and tweaked some legal agreement I think). But
[Tweetbot](https://tapbots.com/tweetbot/) is still standing, and are actively pushing new features.
I'm a happy subscriber.

The team has always produced super slick designs, and their work is still cool in a world which
doesn't really do skeumorphism any longer.

Tweetbot for Mac and iOS have all the features I need. It makes intelligent use of gestures on
respective platform, and I can customise things. No ads. No weird sorting or algorithm. It's
literally how Twitter used to be.
