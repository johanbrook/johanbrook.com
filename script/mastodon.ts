// deno run --allow-net --allow-read --allow-write --allow-env script/mastodon.ts <path>
// Env vars:
// - MASTODON_ACCESS_TOKEN
// - DRY (optional)

import { parse } from 'std/yaml/mod.ts';
import { extract } from 'std/front_matter/any.ts';
import { notePermalinkOf } from '../src/_includes/permalinks.ts';
import * as path from 'std/path/mod.ts';

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
