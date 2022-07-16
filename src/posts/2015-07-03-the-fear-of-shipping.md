---
title: 'Shipped with fear'
date: 2015-07-05
ogImage: 'http://johanbrook.com/assets/posts/fear-of-shipping-ogimage.jpg'
description: 'My thoughts on deploying code to production.'
keywords:
    - sysops
    - devops
    - deploying
    - shipping
    - code
slug: shipped-with-fear
---

**There is a thing that** every developer has to do at some point – ship. By ship I refer to the act
of _deploying, pushing the button, publishing your work for a wide mass_. This act is central in our
industry: blog posts like this one have been written, there have been talks on the subjects, and
methodologies (like Continous Delivery, Continous Integration) invented to deal with the pain points
associated with shipping. Hell, there are even roles (devops, sysops) for easening the burden of
moving code from one system to another. Why, oh why are we conscious and sometimes afraid of
shipping our work?

## Environments of success

At [Lookback](http://lookback.io), we try to continously ship stuff to production. We've got three
environments: _testing_, _staging_, and _production_. Nothing unusual. We use feature branches that
we independently deploy to any of these environments. We merge to master, which is considered
stable, when we've confirmed the bug or feature. This means we can comfortably try out things in
testing and staging and be somewhat sure of that it'll work in production, as long as things like
environment variables and database migrations have run (note how I casually mentioned those
potentially _big_ factors?). We've got a script for rolling back to the version before the deployed
bundle, in case hell breaks loose and we need to quickly restore.

That's the background.

## An anecdote

The thing is: everybody screw up sometime. It might be a premature deploy before thorough QA, poorly
written code which crash in other environments than your own. There are many reasons. But the
important thing is _not to let it get to you_.

Don't tell my team mates, but some nights ago I deployed code that broke the emoji feature in our
production web app. It was a regular expression that went haywire for some production data I had
neglected, and I quickly rolled back, branched off (this was already merged to master), and
continued to push code to the testing environment (with _real_ data this time).

This has happened many times before, and every time I feel kind of slapped in the face. Brought down
to earth again. It's like somebody's saying _"Hey, sonny boy! Don't walk around thinkin' you can
casually push to production without something going wrong! It's bound to happen, ya know"_. And
after every time I tend to be much less liberal in my deploys to production (until I forget about
the incident).

I often compare this with how it was when I was a kid, and went skiing downhill (who am I kidding, I
still feel like this at grown age). I would be cocky and go down this huge hill and get totally
pounded. _"Hey kid! Don't fucking think you're gonna be able to go down here ten times without
falling once! It's bound to happen, ya know"_. I'd then have deep respect for the hill, and be
afraid to go up there, since I was burned once.

See the similarity?

## What to do

I must never, ever become afraid to deploy. The best medicin is to do it often: small, atomical
fixes and features that will get your spirit up again – to confirm that you're still okay. The worst
thing that can happen (engineering wise) in a fast moving startup is loss of momentum – that we stop
deploying to our customers. That we collect these balls of code mud which we push after testing them
internally for some weeks or _months_. Especially for the web, which is ideal for continously dark
deploying to (transparent changes, no need to update any native app code).

But of course: my aim as a developer is to be able to write such solid systems that don't causes
major breakage when deployed. I want to be able to trust myself and the workflow well enough to be
sure and confident when deploying. Some good recipes for that is the aforementioned environment
setup ("test first – confirm on staging – deploy to production"), solid QA, code reviews, and so on.

---

Developers fear change, new things, refactoring, deploying. But we must constantly expose ourselves
to this in order to grow and win over those fears, and learn how to make the wise decision when the
day comes to make a really big, important decision.
