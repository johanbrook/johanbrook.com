// deno run --allow-net --allow-read --allow-env script/wait-for-status.ts
//
// Waits for the latest note|post to be deployed.

import { latestNote } from './util-latest-note.ts';

const ROOT = 'https://johan.im';
const ENDPOINT = new URL('/status.json', ROOT);

const waitForNote = async () => {
    const [latestId] = await latestNote();

    while (true) {
        const deployedId = await fetchStatus('micro');

        if (!deployedId) {
            console.warn('No status for micro');
            await wait(2000);
            continue;
        }

        console.log(`${new Date().toISOString()} Deployed: ${deployedId}. Latest: ${latestId}`);

        if (latestId == deployedId) {
            console.log(`Latest note with ID "${latestId}" is deployed to ${ROOT}!`);
            break;
        }

        await wait(2000);
    }
};

const wait = (ms: number) => new Promise((rs) => setTimeout(rs, ms));

const fetchStatus = async (type: 'micro') => {
    const res = await fetch(ENDPOINT, {
        headers: {
            accept: 'application/json',
        },
    });

    if (!res.ok) return null;

    const json = await res.json();
    return json[type] as string;
};

waitForNote().catch((err) => {
    console.error(err);
    Deno.exit(1);
});
