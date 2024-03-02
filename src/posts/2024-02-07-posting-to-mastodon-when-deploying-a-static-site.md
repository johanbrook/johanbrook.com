---
title: Posting to Mastodon when deploying a static site
slug: posting-mastodon-deploying-static-site
date: 2024-02-07 21:36:58 +7
timezone: Asia/Bangkok
excerpt: tldr; find the latest note, check if it's not posted already, post, persist to log file.
location: Koh Lanta, Thailand
tags:
  - ssg
  - mastodon
---

This is how I made my [micro notes](/micro) auto-post to my Mastodon account. Warning: duct-tape and
strings ahead. I wrote this system during the nighttime hours in the hospital, where I watched over
our 10 month old baby who had contracted bronchitis (no worries, everything turned out fine with
her).

## Preface: my setup

- I use a static site generator. I use [Lume](http://lume.land), but that doesn't really matter.
- I host my site on GitHub Pages. Not likely to matter.
- I use GitHub Actions for actually deploying my site from the repo to GitHub Pages. This probably
  matters a lot. As long as you have _something_ that runs on every push, you should be able to
  translate the steps below to `$YOUR_CI`.

I don't use any persistent database anywhere (I use Cloudflare functions for other features in this
site). Since the entrypoint to deploy _anything_ on this site is via pushing commits onto the `main`
branch, that's the key for doing anything "hook-y", like taking an action when some content is
updated.

---

## The plan

Roughly, it works like below. You should be able to translate it to your host/CI runner:

1. Push new micro note/blog post.
2. On CI, check out the code base and find the filename of the post file. Make some slug/ID out of
   it.
3. Look for the slug/ID in a checked in file. This is our "database" over already posted files.
4. If it's there, bail.
5. If not, we run a script to format the post text and post it to Mastodon over its API.
6. Write the file slug/ID to the checked in file. Commit and push (this is still in CI).

<details class="Notice">
<summary>Bonus</summary>

I also do some fanciness before step 5) where I wait before the site is fully deployed before I post
to Mastodon. If not, people could click the linkback to the post on Mastodon and get to a 404 on my
site!

Here's the source code. Note the `ENDPOINT` variable which is `https://johan.im/status.json`, where
I — at build time — put all goodies.

```bash
#!/usr/bin/env bash
#
# Waits for a give note to be deployed at johan.im
#
# Usage:
# ./script/wait-for-status.sh <path to note>
# ./script/wait-for-status.sh --latest

ENDPOINT="https://johan.im/status.json"
DIR="src/notes"

file_path="$1"

if [ -z "$file_path" ]; then
    echo "Usage: script/wait-for-status.sh <path> | --latest"
    exit 1
fi

if [ "$file_path" == "--latest" ]; then
    file_path=$(ls -r1 "$DIR" | grep -v "_" | head -n 1)
else
    file_path=$(basename "$file_path")
fi

# 2022-01-04-09-37.md -> 202201040937
file_id=$(echo "$file_path" | sed -e "s/-//g" | cut -f 1 -d ".")

while true; do
    deployed=$(curl -s "$ENDPOINT" | jq -r ".micro")
    is_deployed=$([ "$deployed" = "$file_id" ] && echo true || echo false)

    echo "$([ "$is_deployed" = true ] && echo "✅" || echo "🕣") [$(date -u)] Deployed: $deployed $([ "$is_deployed" = true ] && echo "==" || echo "!=") Latest: $file_id"

    if [ "$is_deployed" = true ]; then
        break
    fi

    sleep 2
done
```

</details>

## Deciding when to post

As mentioned, I use GitHub Actions. YAML seems to be the requirement for all new CI tools these
days, and Actions isn't an exception. This is how the first part of my
`.github/workflows/deploy.yml` looks like. The code below includes the steps 2-3):

<details>
    <summary><code>deploy.yml</code></summary>

{% raw %}

```yaml
name: Build and deploy

on:
    push:
        paths:
            - "src/**/*"

env:
    DENO_VERSION: v1.40.3
    MASTODON_LOG_FILE: .mastodon-notes
    NOTES_DIR: src/notes

jobs:
    build:
        name: Build
        # Omitted: builds the static site into .html files
    deploy:
        name: Deploy
        # Omitted: puts the built site onto gh-pages branch
    check_latest_note:
        name: Check latest note
        runs-on: ubuntu-latest
        outputs:
            do_post: ${{ steps.mastodon_note_check.outputs.do_post }}
            latest_note_id: ${{ steps.mastodon_note_check.outputs.latest_note_id }}
            latest_note_path: ${{ steps.mastodon_note_check.outputs.latest_note_path }}
        steps:
            - name: Checkout code
              uses: actions/checkout@v4

            - name: Check if latest note is already posted
              id: mastodon_note_check
              run: |
                latest="$NOTES_DIR/$(ls -r1 "$NOTES_DIR" | grep -v "_" | head -n 1)"
                note_id=$(./script/check-mastodon-note.sh "$latest")
                [ -z "$note_id" ] && echo "Latest note $latest is posted. Bail." || echo "Latest note $latest is not posted. Do post."
                [ ! -z "$note_id" ] && echo "do_post=true" >> "$GITHUB_OUTPUT"
                echo "latest_note_id=$note_id" >> "$GITHUB_OUTPUT"
                echo "latest_note_path=$latest" >> "$GITHUB_OUTPUT"
                cat "$GITHUB_OUTPUT"
              env:
                  NOTES_DIR: ${{ env.NOTES_DIR }}
```

{% endraw %}

</details>

Let's go over it.

```bash
latest="$NOTES_DIR/$(ls -r1 "$NOTES_DIR" | grep -v "_" | head -n 1)"
```

This puts the latest file in `src/notes` into a `$latest` variable. Like this:

```bash
$ NOTES_DIR="src/notes"
$ latest="$NOTES_DIR/$(ls -r1 "$NOTES_DIR" | grep -v "_" | head -n 1)"
$ echo $latest
src/notes/2024-02-03-21-21-00.md
```

We feed that into the `check-mastodon-note.sh` script I have in a separate file, since I'm an
inconsistent, chaotic programmer. Before reading that code, I'll show you how my "database" over
posted notes look like:

```bash
$ cat .mastodon-notes
20231215140531
20240106124758
20240118204458
```

It's an append log with the note date (hyphens removed). Ergo, if the note date is in that list,
we've posted to Mastodon already and can bail early.

Here's my script for checking that:

<details>
    <summary><code>check-mastodon-note.sh</code></summary>

```bash
#!/usr/bin/env bash
#
# Check whether we've posted the input file path to Mastodon (persisted in $MASTODON_LIST)
#
# Usage:
#
# ./script/check-mastodon-note.sh <path to file>
# ./script/check-mastodon-note.sh --latest
# same as:
# ./script/check-mastodon-note.sh $(ls -r1 "src/notes" | grep -v "_" | head -n 1)

MASTODON_LIST=".mastodon-notes"
DIR="src/notes"

file_path="$1"

if [ "$file_path" == "--latest" ]; then
    file_path=$(ls -r1 "$DIR" | grep -v "_" | head -n 1)
else
    file_path=$(basename "$file_path")
fi

# 2022-01-04-09-37.md -> 202201040937
file_id=$(echo "$file_path" | sed -e "s/-//g" | cut -f 1 -d ".")

case `cat "$MASTODON_LIST" | grep -Fxq "$file_id" >/dev/null; echo $?` in
  0)
    # found
    exit 0
    ;;
  1)
    # not found, continue
    echo "$file_id"
    exit 0
    ;;
  *)
    # error
    echo "An error occurred when checking $MASTODON_LIST for note: $file_id" 1>&2
    exit 1
    ;;
esac
```

</details>

We print the resulting note ID (date with hyphens removed) on `stdout` if we _don't_ find it in the
list. Sweet! Back to the deploy YAML:

```yaml
[ ! -z "$note_id" ] && echo "do_post=true" >> "$GITHUB_OUTPUT"
echo "latest_note_id=$note_id" >> "$GITHUB_OUTPUT"
echo "latest_note_path=$latest" >> "$GITHUB_OUTPUT"
```

Push some metadata into the magic `GITHUB_OUTPUT` environment variable (which points to a file).
This is GitHub's way of persisting data between jobs.

## Posting to Mastodon's API

This is the API posting part of `deploy.yml`:

<details>
    <summary><code>deploy.yml</code></summary>

{% raw %}

```yaml
post_mastodon:
    name: Post to Mastodon
    needs: [deploy, check_latest_note] # can't send post with permalink until site is deployed
    runs-on: ubuntu-latest
    if: needs.check_latest_note.outputs.do_post == 'true'
    steps:
        - name: Checkout code
          uses: actions/checkout@v4

        - name: Setup Deno
          uses: denoland/setup-deno@v1
          with:
              deno-version: ${{ env.DENO_VERSION }}

        - name: Post to Mastodon API
          run: deno run --allow-net --allow-read --allow-write --allow-env script/mastodon.ts "$LATEST_NOTE_PATH"
          env:
              MASTODON_ACCESS_TOKEN: ${{ secrets.MASTODON_ACCESS_TOKEN }}
              LATEST_NOTE_PATH: ${{ needs.check_latest_note.outputs.latest_note_path }}
```

{% endraw %}

</details>

`if: needs.check_latest_note.outputs.do_post == 'true'` will skip this job if we bailed in the
previous job. Very handy.

<details class="Notice">
    <summary>How to obtain an access token for Mastodon's API</summary>

Fear not, Mastodon are one of those services which has a seat in heaven: they give you a plain old
access token (bearer) which you can use in all API calls 🥹 No messing around with OAuth.

Read all about it [in their docs](https://docs.joinmastodon.org/client/token/).

Then put the token as `MASTODON_ACCESS_TOKEN` in your repo's secret section in settings.

</details>

The `mastodon.ts` script itself isn't that interesting. In a nutshell, it reads the contents of the
file on the path it receives as script argument, parses some front matter, truncates the text, makes
a permalink, and do a `POST` to the API.

<details>
    <summary><code>mastodon.ts</code></summary>

```ts
// deno run --allow-net --allow-read --allow-write --allow-env script/mastodon.ts <path>
// Env vars:
// - MASTODON_ACCESS_TOKEN
// - DRY (optional)

import { parse } from 'yaml';
import { extract } from 'front_matter/any.ts';
import { notePermalinkOf } from '../src/_includes/permalinks.ts';
import * as path from 'path';

const DRY_RUN = !!Deno.env.get('DRY');

const accessToken = Deno.env.get('MASTODON_ACCESS_TOKEN');

if (!accessToken) {
    console.error('No ACCESS_TOKEN');
    Deno.exit(1);
}

const metaFile = import.meta.dirname + '/../src/_data/meta.yml';

interface Meta {
    site: string;
    mastodon: {
        instance?: string;
    };
}
const meta = (await Deno.readTextFile(metaFile).then(parse)) as Partial<Meta>;

if (!meta?.mastodon?.instance) {
    console.error(`No mastodon.instance key in ${metaFile.toString()}`);
    Deno.exit(1);
}

const truncateToStatus = (str: string, permalink: string) => {
    const maxLimit = 500;
    const footer = `\n\n↳ ${permalink}`;
    const statusLimit = maxLimit - footer.length;

    if (str.length <= statusLimit) {
        return str + footer;
    }

    return str.slice(0, statusLimit - 1) + '…' + footer;
};

const API_ROOT = `https://${meta.mastodon.instance}`;

const postStatus = async (filePath: string) => {
    console.log(`Posting contents of ${filePath}`);

    const latestId = path.basename(filePath).replaceAll('-', '').split('.').at(0)!;

    console.log(`Latest note ID is: ${latestId}`);

    const note = extract(await Deno.readTextFile(import.meta.dirname + `/../${filePath}`));

    if (note.attrs.draft || note.attrs.skip_mastodon) {
        console.log(
            `Skipping posting because one of "draft" or "skip_mastodon" are true for note ${filePath}`,
        );
        return;
    }

    const permalink = meta.site + notePermalinkOf(latestId);

    const statusBody = truncateToStatus(note.body.trim(), permalink);

    console.log(
        `> Posting status (${statusBody.length} chars):\n----------------------------\n${statusBody}`,
    );

    if (DRY_RUN) {
        console.log(`> Status posted to <DRY RUN>`);
        return;
    }

    const url = new URL('/api/v1/statuses', API_ROOT);
    const form = new FormData();

    form.append('status', statusBody);

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Idempotency-Key': crypto.randomUUID(),
        },
        body: form,
    });

    const json = await res.json();

    if (!res.ok) {
        throw new Error(`Posting failed with ${res.status}: ${json.error}`);
    }

    console.log(`> Status posted to ${json.url}`);
};

// Main

if (!Deno.args[0]) {
    console.error('Run with mastodon.ts <path to note>');
    Deno.exit(1);
}

await postStatus(Deno.args[0]).catch((err) => {
    console.error(err);
    Deno.exit(1);
});
```

</details>

## Persisting to the database file

Yay, you've made it this far! Let's check out the final stretch of the lovely YAML:

<details>
    <summary><code>deploy.yml</code></summary>

{% raw %}

```yaml
- name: Write to log
  run: |
      echo "$LATEST_UNPOSTED" >> $MASTODON_LOG_FILE
      cat "$MASTODON_LOG_FILE"
  env:
      MASTODON_LOG_FILE: ${{ env.MASTODON_LOG_FILE }}
      LATEST_UNPOSTED: ${{ needs.check_latest_note.outputs.latest_note_id }}

- name: Commit and push posted notes
  run: |
    git config user.name "Automated"
    git config user.email "actions@users.noreply.github.com"
    git add $MASTODON_LOG_FILE
    timestamp=$(date -u)
    git commit -m "Latest post to Mastodon: $timestamp [skip-ci]" || exit 0
    git push
  env:
      MASTODON_LOG_FILE: ${{ env.MASTODON_LOG_FILE }}
```

{% endraw %}

</details>

1. Append the date/ID of the latest post into the log/database file.
2. Commit this and push to persist.

Done!

---

As you can see, it's essentially just keeping track of the latest unposted file and shoves that
around betwen the steps in the GitHub Action 🤷 But I like the approach of thinking in files and
thus always keeping the state within the repo's boundaries.

I love DIY solutions over external services. Mo' dependencies, mo' problems.
