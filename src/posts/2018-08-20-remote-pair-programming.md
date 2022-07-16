---
title: Better Remote Pair Programming
slug: remote-pair-programming
date: 2018-08-24
keywords:
  - pair programming
  - remote
  - vs code
  - real time
  - sharing
excerpt: How to improve pair programming for remote developers, with a few simple tools.
---

**Pair programming** is the concept of two developers working together, in real-time, on the same
code base on the same device. There are some variations and techniques that vary from organisation
to organisation around pair programming, but to me, it boils down to the concept of _"Two brains are
better than one, depending on the problem"_. A spin-off is
[mob programming](https://en.wikipedia.org/wiki/Mob_programming), where the whole team works on the
same thing.

Pair programming is ideal when onboarding a new developer into a code base by solving a problem,
like building a new feature or fixing a bug. In day-to-day work, pair programming is helpful in
capturing bugs that a single developer wouldn't had noticed. It's also great for reasoning about
high level strategic parts of the code together with another developer.

This post isn't about the pros and cons of pair programming (there are a ton of material to digest
about that online).

But what about remote work and pair programming? Since the physical aspect of traditional pairing is
one of the main pros, it has been hard to replicate when all developers are working remote.

## Background

[At work](http://lookback.io), we started a project where we needed to start off with a whole new
code base. The task at hand involved rewriting an existing web frontend in React views, built on a
functional reactive software pattern. We also had to integrate it against our existing Meteor
backend, for data loading and user authentication. Finally, it needed to talk with an in-house
WebRTC service.

So we had a few unknowns:

1. How do we handle TypeScript compilation in the existing code base?
2. How to intergrate new React views in the Meteor frontend?
3. How to drive the frontend state from the Meteor backend?
4. How to manage frontend state and WebRTC connections with the functional reactive pattern?

I had an inkling on how to solve 1) and 2). I had very little experience in 3) and 4). A colleague,
who was a big driver behind the functional reactive pattern, had expertise in 3) and 4). But due to
our [remote setup](/writings/intimate-remote-work/) at the company, we couldn't sit down for a hack
day and flesh things out together.

## The problems

The problems with remote and pair programming are thus:

1. Not being in the same physical space – tricker to have high bandwidth communication.
2. Cannot work on the same computer.
3. Cannot with ease see what the other developer is seeing.

"Okay, Johan", you say. "You can remedy at least 2) and 3) in that list with remote control
applications and screensharing". Yes you can! **That's precisely what this post is about ✨**

## The solutions

What if I told you that you can pair program like you're pair writing on a Google Doc, right from
inside your code editor?

Well, you can.

Me and my colleague landed on these two tools:

- VS Code
- Slack voice call

### Co-operating on the code

This was the deal breaker for us: how to co-operate on the code base without introducing old school
solutions like remote control software? We wanted this to _feel_ like your own editor, even you were
remote.

Luckily, the developers behind the popular editors Atom and VS Code have worked on this.

- **For VS Code,** there is
  ["Live Share"](https://marketplace.visualstudio.com/items?itemName=MS-vsliveshare.vsliveshare).
- **For Atom,** there is ["Teletype"](https://teletype.atom.io/).

We've only used VS Code, so I'm going to cover that only in this post.

VS Code's Live Share works like this:

1. One developer hosts a session on their computer, by
   [installing the extension](https://marketplace.visualstudio.com/items?itemName=MS-vsliveshare.vsliveshare).
2. The developer hits _"Share"_ in the editor's bottom status bar. VS Code will ask them to auth
   with GitHub or Windows Live (yea, right…).
3. Once that's done, VS Code puts a link in the clipboard, and the developer can send it to
   co-workers. Hitting the _"Share"_ button again brings up a menu to manage the sharing session.

<img src="/assets/posts/vs-code-share.png" alt="VS Code" style="width: 600px">

You can now:

- Co-edit
- Co-debug
- Share a server
- Share a terminal

When your co-developer joins, they can navigate your workspace right from within their own editor.

### Talking along the way

The solution here is to set up a voice or video call on the side of VS Code or Atom. It's really
great to be able to talk alongside working with the code with your colleague.

## Conclusion

Just because you're working remote doesn't have to mean that you're "on your own" with tricky code
problems. It's _totally_ doable to pair program when you're stuck, or need guidance in a new system
or programming language. Existing solutions include screen sharing and remote control and all kinds
of boring setups. Having code sharing right from within your editor is really great, which makes it
easier to focus on the code and collaboration. The fact that you are working remote won't matter
when your colleague is just a link away from your editor.

Some features are still lacking in the VS Code extension to make it feel "just like my own editor".
The most annoying one is that the guest isn't able to jump between files. And I'd love a nicer way
to highlight "Here I am!" from within the editor, since you're probably gonna jump around in the
project structure.

## Appendix

- On the tech side, I'm not sure exactly how VS Code has built the code sharing architecture.
  There's no open source repository for the project, except for a
  [documentation repo](https://github.com/MicrosoftDocs/live-share). That's too bad… The
  [Atom folks](https://teletype.atom.io/) have built their system in WebRTC, where the initial
  handshake goes to their servers, but the actual code sharing goes over Peer-to-peer connect to
  avoid any middle men.
- We experienced some weird bug in VS Code at the time of writing where the text editor would freak
  out when one of us hit `cmd+z` to undo a text input. The editor would go haywire and delete most
  of the code written to that point. But then it was magically restored.
