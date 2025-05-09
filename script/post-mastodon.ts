// deno run --allow-net --allow-read --allow-env script/post-mastodon.ts
// Env vars:
// - MASTODON_ACCESS_TOKEN
// - DRY (optional)
import { postStatus, Todo, TODO_PATH } from '../_syndicate.ts';

const dryRun = !!Deno.env.get('DRY');
const accessToken = Deno.env.get('MASTODON_ACCESS_TOKEN');

if (!accessToken) {
    console.error('No ACCESS_TOKEN');
    Deno.exit(1);
}

const todo = JSON.parse(await Deno.readTextFile(TODO_PATH)) as Todo;

await postStatus(todo, accessToken, dryRun).catch((err) => {
    console.error(err);
    Deno.exit(1);
});
