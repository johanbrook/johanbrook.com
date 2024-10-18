import { idOf, notePermalinkOf } from './src/_includes/permalinks.ts';

export interface Todo {
    id: string;
    /** Description or excerpt from content. */
    description?: string;
    /** Raw Markdown content. */
    content: string;
    /** Parsed `content`. */
    children: string;
    meta: Record<string, any>;
    sourcePath: string;
}

export const maybeSaveTodo = async (page: Lume.Page) => {
    const done = await Deno.readTextFile('./.mastodon-notes');
    const id = idOf(page.sourcePath);

    // Already posted, bail
    if (done.includes(id)) {
        console.log(`Page already exists in .mastodon-notes: ${id} (${page.sourcePath}). Skipping…`);
        return;
    }

    if (page.data.draft || page.data.skip_mastodon) {
        console.log(
            `Skipping posting because one of "draft" or "skip_mastodon" are true for note ${page.sourcePath}`,
        );
        return;
    }

    const todo: Todo = {
        id,
        children: page.data.children,
        content: page.data.content as string,
        meta: page.data.meta,
        sourcePath: page.sourcePath,
        description: page.data.excerpt || page.data.description,
    };

    await Deno.writeTextFile('./.mastodon-todo.json', JSON.stringify(todo));
    console.log(`Wrote ${page.sourcePath} to .mastodon-todo.json`);
};

export const postStatus = async (todo: Todo, accessToken: string, dryRun = false) => {
    const API_ROOT = `https://${todo.meta.mastodon.instance}`;

    console.log(`> To be posted: ${todo.id} (${todo.sourcePath})`);

    const permalink = todo.meta.site + notePermalinkOf(todo.id);

    const statusBody = truncateToStatus(todo, permalink);

    console.log(`> Posting status (${statusBody.length} chars):`);
    console.log('\n' + indent(`${statusBody}`, 3) + '\n');

    if (dryRun) {
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

const indent = (str: string, n: number) => {
    const INDENT = ' '.repeat(n);
    return str.replaceAll('\n', `\n${INDENT}`).replace(/^/, INDENT);
};

const truncateToStatus = (note: Todo, permalink: string) => {
    const maxLimit = 500;
    const footer = `\n\n→ ${permalink}`;
    const statusLimit = maxLimit - footer.length;

    const truncate = (str: string) => {
        if (str.length <= statusLimit) {
            return str + footer;
        }

        return str.slice(0, statusLimit - 1) + '…' + footer;
    };

    // 1. Explicit excerpt or description.
    if (note.description) return truncate(note.description);

    const str = note.content;

    // 2. Use first paragraph.
    const firstMarkdownParagraph = str.split('\n\n').at(0);

    if (firstMarkdownParagraph) return truncate(firstMarkdownParagraph);

    // 3. Truncate the whole body.
    return truncate(str);
};
