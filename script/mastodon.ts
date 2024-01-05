// deno run --allow-net --allow-read --allow-write --allow-env script/mastodon.ts
import { parse } from 'yaml';
import { extract } from 'front_matter/any.ts';
import { notePermalinkOf } from '../src/notes/_data.ts';

const accessToken = Deno.env.get('MASTODON_ACCESS_TOKEN');

const DRY_RUN = !!Deno.env.get('DRY');
const PERSISTED_PATH = new URL('../.mastodon-notes', import.meta.url);

if (!accessToken) {
    console.error('No ACCESS_TOKEN');
    process.exit(1);
}

const metaFile = new URL('../src/_data/meta.yml', import.meta.url);
const meta = await Deno.readTextFile(metaFile).then(parse);

if (!meta?.mastodon?.instance) {
    console.error(`No mastodon.instance key in ${metaFile.toString()}`);
    process.exit(1);
}

const latestNote = async () => {
    const NOTES_DIR = 'src/notes';

    const latest: string = await Array.fromAsync(Deno.readDir(new URL('../' + NOTES_DIR, import.meta.url))).then((fs) =>
        fs
            .filter((f) => f.isFile && f.name.slice(-2) == 'md')
            .map((f) => f.name)
            .sort()
            .at(-1)
    );

    const alreadyDone = await Deno.readTextFile(PERSISTED_PATH).then((lines) =>
        lines.split('\n').filter((x) => !!x && x[0] != '#')
    );

    // 2023-01-01-04-30-30.md -> 202301010430
    const latestId = latest.replaceAll('-', '').split('.').at(0);

    // Nothing to do
    if (alreadyDone.includes(latestId)) {
        return null;
    }

    const file = await Deno.readTextFile(new URL(`../${NOTES_DIR}/` + latest, import.meta.url));

    return [latestId, extract(file)];
};

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

    const n = await latestNote();

    if (!n) {
        console.log('Nothing to do');
        return;
    }

    const [latestId, note] = n;

    const permalink = meta.site + notePermalinkOf(note.attrs.date);

    const statusBody = truncateToStatus(note.body.trim(), permalink);

    console.log(`> Posting status (${statusBody.length} chars):\n----------------------------\n${statusBody}`);

    if (DRY_RUN) {
        console.log(`> Status posted to <DRY RUN>`);
        console.log(`> Wrote ${latestId} to .mastodon-notes`);
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

    await writeNoteToLog(latestId);
};

const writeNoteToLog = async (id: string) => {
    await Deno.writeTextFile(PERSISTED_PATH, id + '\n', { append: true });
    console.log(`> Wrote ${id} to .mastodon-notes`);
};

// Main

await postStatus().catch((err) => {
    console.error(err);
    Deno.exit(1);
});
