# Johan's site

![Build & Deploy](https://github.com/johanbrook/johanbrook.com/actions/workflows/deploy.yml/badge.svg)

## Setup

1. Install [deno](https://deno.land):

```bash
# Mac and Linux
curl -fsSL https://deno.land/install.sh | sh
```

[Other installation options](https://deno.land/#installation) exist too.

2. Install [Lume](https://lumeland.github.io) locally:

```bash
deno run -A https://deno.land/x/lume/install.ts
```

## Build

```bash
deno task build
```

## Serve

```bash
deno task serve
```

## Scripts

**Create a new post**

```bash
./script/new-post
```

**Create a new note ("what's on my mind")**

```bash
./script/new-note
```

**Manual re-deploy**

If something's messed up, this is new without having to do a content change.

```bash
./script/deploy
```
