---
title: Recent improvements in our git workflow
slug: git-guidelines
date: '2020-02-19T20:04'
location: My desk in Stockholm
excerpt: The git history of a repository a few years in or with more than one collaborator will look like thick weed unless you take care of it. Here are some
keywords:
  - git
  - commit messages
  - rebase
draft: true
---

The git history of a repository a few years in or with more than one collaborator will look like thick weed unless you take care of it. During last Autumn in [Lookback](http://lookback.io), the engineering team noticed that we needed to take care of some weeds.

Not only in our committing code culture, but also in the land of code reviews and Pull Requests at GitHub.

Here are some of the principles and guidelines we worked out.

# Empathy for others and your future self

We say:

> "Please have empathy for your coworkers when committing code. Be considerate of them as well as your future self".

When working in a long living code base with lots of complex and moving parts, bugs can surface weeks or months after you wrote the code. Guess what system helps you go back in time and find exactly what, when, and who changed a line of code?! git can! Guess what doesn't help git help you? These things:

- Unclear commit messages.
- Incoherent and too large commits.
- Not easily revertable commits (connected with the above).
- Merge commits.

Failure to avoid these things will bite you when debugging something in the future.

For us, we didn't enforce or point these things out in code reviews either. One person could file a Pull Request 10+ commits, where some of them wouldn't even be related to the PR itself. It was hard to give good feedback on a commit which said `fix some things in logging`: what did you fix? Why?

"You've got to give love to receive love". Meaning, "you've got to give your co-workers good PRs in order to receive good feedback". A related joke is the old "20 commit PR? LGTM. One commit? A novella of feedback".

We decided to reboot our engineering culture around clean commits and PRs. What follows are some of the guidelines we drafted for working with code.

---

# 1. Committing code

Make each commit **atomical**. That is, make it include only the relevant code for your intended change. There's a lot to read about this subject on the web.

When submitting a patch for code review, consider grouping together similar commits with `git rebase`("squashing") to keep commit count down (_without_ breaking the rule about atomical commits above!).

The `master` branch's history should ideally be a long string of commits. We should avoid merge commits by rebasing in `master` into your feature branch before merging back.

## Commit messages

- Try to focus on the _why_ in commit messages. Not necessarily _what_. Think about how this commit will be read when doing a `git blame` half a year later. The reader is probably interested in _why_ this change happened.
- Capturing the _why_ context is super important, since it's probably tricky to recover later. Save yourself some future slack and capture the why _now_.
- Adding any references (Clubhouse cards, etc) is appreciated.

["How to Write a Git Commit Message"](https://chris.beams.io/posts/git-commit/) includes some no brainer guidelines for good commit messages.

# 2. Submitting Pull Requests

**Have mercy for your coworkers.** Don't dump an unstructured, large PR on them with "Review this!!". Be considerate of their time and energy when submitting, as it might be very hard for them to get into the context you've been into the last couple of days while working on the code.

Make all PRs minimal, concise, and relevant. Don't include non-trivial refactors of modules in a PR that's really supposed to do something else.

Avoid long living branches. By making small, incremental changes, we avoid messy merge conflicts and best of all: we avoid risky deploys. It's easier to reason about small patches, and potentially rolling them back, than huge blobs of "fix everything" PRs.

Feel free to use GitHub's "draft pull request" mode. That means it's not supposed to be reviewed or be merged yet. You can create a draft PR as soon as you've got one commit. That PR can be attached to a ClubHouse card if you'd like, and your coworkers can follow your work.

Make sure your PR is rebased on `master` when submitting it. That removes the need for merge commits when merging back to `master`.

When your PR is ready for review (implies that you also think it's ready for merge), **you must make sure it's neat and tidy**.

- Squash any similar commits together.
- Look at each commit and see if it makes sense: does it have a nice message? Is the code changes relevant and atomical? If a coworker does a `git log` in two months, will they be able to understand this change?

After receiving a code review with change requests, always try to squash those changes together with the initial commits made when first submitting the PR. It's okay if you have lots of smaller commits in your feature branch _while working_ with the code. But once it's ready for review and later merge into `master`, the final PR _must_ be in a concise, minimal state.

The code reviewer may reject your PR if it's:

- Too large ("please break into separate PRs").
- Unstructured/needs squashing ("please restructure this PR", "please redo your commit history").

This does **_not_** mean "you suck". It's a signal that you can learn how to avoid this the next time, as well as avoding wasting your coworkers' time. We aim to learn and become a better developer (and co-developer!) with code reviews, since it's so easy to do your own thing when you've been down in a code cave for a couple of days.

# 3. Tools & patterns

When rebasing your branch – either to rebase in `master` or rewrite history – the branch will be diverging from the remote, if you've pushed it already. So you need to force push next time (`git push -f`).

## Commit messages

Make a one-line (max 50 chars) subject line. Optionally followed with a commit message body (max 72 chars per line).

💡**Tip:** Use a commit message template to base messages on:

```
[one line-summary of changes]

Because:
- [relevant context]
- [why you decided to change things]
- [reason you're doing it now]

This commit:
- [does X]
- [does Y]
- [does Z]
```

[Read more about setting this template up](https://thoughtbot.com/blog/better-commit-messages-with-a-gitmessage-template).

## Rebasing

See this guide from the git docs: ["Rebasing"](https://git-scm.com/book/en/v2/Git-Branching-Rebasing).

For instance:

```bash
git checkout my-feature-branch
# ...do work
# ...changes have been made in remote master
# fetch/pull latest master
git rebase master
```

This will re-apply your commits in the feature branch on top of what's in `master` , to make it appear as your branch is branched off of latest commit in `master`.

💡**Tip:** use `git fetch origin master:master` from your feature branch to fetch latest `master` without leaving your branch.

There's a ton of magic things one can do with `rebase`, please consult the internet or ask coworkers about rebasing strategies.

- Please **do** rebase `master` into your feature branch when there are upstream changes in `master`.
- Please **don't** use `git merge` when including changes from `master` to your feature branch.

## Conflicts

Note that there might be conflicts when rebasing. You'll be able to solve them in the same way as when manually solving conflicts when doing `git merge`. This is all described in the terminal when there's a conflict. In a nutshell

```bash
# Find conflicts in code:
git status
# ..Fix them :)
# Mark as resolved:
git add <file>
# Continue rebasing
git rebase --continue
```

## Force pushing to collaborative branches

Rewriting history requires you to force push the PR branch. I.e. you need to push with `git push -f`

The problem with force pushing is that anyone collaborating on the branch will not be able to just `git pull`. However, git introduced a switch on `pull` which fixes this:

```bash
git pull --rebase
```

This is essentially a

```bash
git fetch origin
git rebase origin/<your-branch>
```

## Squashing commits together

This is nice for when you've done a lot of small, work preserving commits (WIPs or just to not lose them) that need to be "beautified" before submitting for review.

See this guide from the git docs: ["Rewriting History"](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History).

In a nutshell:

```bash
# -i is for "interactive"
# git rebase -i <git reference>
# HEAD~<number of commits to include in rebase>
git rebase -i HEAD~5
# or
git rebase -i git-hash^ # ^ is targetting the parent commit
```

An editor will open with your included commits listed. There'll be a legend below them describing how to rewrite history. You can drop commits (`d`), squash together commits (`s`), and more. You'll be able to rewrite the commits messages too.

💡**Hint:** GitHub also allows you to squash and merge a PR from the GitHub UI. Could be handy.
