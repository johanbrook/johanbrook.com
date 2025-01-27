import { idOf, notePermalinkOf } from './src/_includes/permalinks.ts';
import { extract } from 'std/front_matter/any.ts';
import * as Yaml from 'std/yaml/mod.ts';

export interface Todo {
    id: string;
    /** Description or excerpt from content. */
    description?: string;
    /** Specially crafted for social media statuses. */
    statusBody?: string;
    /** Raw Markdown content. */
    content: string;
    /** Parsed `content`. */
    children: string;
    meta: Record<string, any>;
    sourcePath: string;
}

export const TODO_PATH = './.mastodon-todo.json';
const LOG_FILE = '.mastodon-notes';

export const maybeSaveTodo = async (page: Lume.Page) => {
    const done = await Deno.readTextFile(LOG_FILE);
    const id = idOf(page.sourcePath);

    // Already posted, bail
    if (done.includes(id)) {
        console.log(`Page already exists: ${id} (${page.sourcePath}). Skipping…`);
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
        statusBody: page.data.statusbody,
    };

    await Deno.writeTextFile(TODO_PATH, JSON.stringify(todo));
    console.log(`Wrote ${page.sourcePath} to ${TODO_PATH}`);
};

export const postStatus = async (todo: Todo, accessToken: string, dryRun = false) => {
    const API_ROOT = `https://${todo.meta.mastodon.instance}`;

    console.log(`> To be posted: ${todo.id} (${todo.sourcePath})`);

    const permalink = todo.meta.site + notePermalinkOf(todo.id);

    const statusBody = truncateToStatus(todo, permalink);

    console.log(`> Posting status (${statusBody.length} chars):`);
    console.log('\n' + indent(`${statusBody}`, 3) + '\n');

    if (dryRun) {
        await persistStatusUrl(todo, 'https://fake-url.com', true);
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

    interface Status {
        id: string;
        url: string;
    }

    interface Error {
        error: string;
    }

    if (!res.ok) {
        const err = await res.json() as Error;
        throw new Error(`Posting failed with ${res.status}: ${err.error}`);
    }

    const json = await res.json() as Status;

    console.log(`> Status posted to ${json.url}`);

    await persistStatusUrl(todo, json.url);
};

export const persistStatusUrl = async (todo: Todo, url: string, dryRun = false) => {
    const data = {
        fediUrl: url,
    };

    const filePath = './src' + todo.sourcePath;

    const post = await Deno.readTextFile(filePath);
    const res = extract(post);
    const newData = {
        ...res.attrs,
        ...data,
    };

    const content = `---\n${Yaml.stringify(newData)}---\n${res.body}`;

    if (dryRun) {
        console.log(`> Save to ${filePath}`);
        console.log(content);
    } else {
        await Deno.writeTextFile(filePath, content);
    }
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

    const status = note.statusBody ?? note.description;

    // 1. Use explicit status or description field.
    if (status) return truncate(status);

    const content = note.content;

    // 2. Use first paragraph.
    const firstMarkdownParagraph = content.split('\n\n').at(0);

    if (firstMarkdownParagraph) return truncate(firstMarkdownParagraph);

    // 3. Truncate the whole body.
    return truncate(content);
};
