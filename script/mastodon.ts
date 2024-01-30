// deno run --allow-net --allow-read --allow-write --allow-env script/mastodon.ts
import { parse } from 'yaml';
import { extract } from 'front_matter/any.ts';
import { latestNote } from './util-latest-note.ts';
import { notePermalinkOf } from '../src/_includes/permalinks.ts';

const accessToken = Deno.env.get('MASTODON_ACCESS_TOKEN');

const DRY_RUN = !!Deno.env.get('DRY');
const CI = !!Deno.env.get('CI');

if (!accessToken) {
    console.error('No ACCESS_TOKEN');
    process.exit(1);
}

const metaFile = import.meta.dirname + '/../src/_data/meta.yml';
const meta = await Deno.readTextFile(metaFile).then(parse);

if (!meta?.mastodon?.instance) {
    console.error(`No mastodon.instance key in ${metaFile.toString()}`);
    process.exit(1);
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

const postStatus = async () => {
    const url = new URL('/api/v1/statuses', API_ROOT);
    const form = new FormData();

    const [latestId, filePath] = await latestNote();

    console.log(`Latest note ID is: ${latestId}`);

    const note = extract(await Deno.readTextFile(import.meta.dirname + `/../${filePath}`));

    const permalink = meta.site + notePermalinkOf(latestId);

    const statusBody = truncateToStatus(note.body.trim(), permalink);

    console.log(`> Posting status (${statusBody.length} chars):\n----------------------------\n${statusBody}`);

    if (DRY_RUN) {
        console.log(`> Status posted to <DRY RUN>`);
        return;
    }

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

await postStatus().catch((err) => {
    console.error(err);
    Deno.exit(1);
});
