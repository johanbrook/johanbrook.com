import { FileHost } from '../services/index.ts';
import { join } from 'std/path/mod.ts';
import * as Yaml from 'std/yaml/mod.ts';

export interface Note {
    contents: string;
    fileName: string;
    meta: Meta;
}

interface Meta {
    [index: string]: unknown;
    date: string;
    location?: string;
    tags?: string[];
    timezone?: string;
}

export const add = async (host: FileHost, note: Note): Promise<Note> => {
    await host.putFile(addFrontMatter(note.contents, note.meta), join('src/notes', note.fileName));
    return note;
};

const addFrontMatter = <T extends Record<string, unknown>>(
    contents: string,
    fm: T,
): string => {
    const copy = { ...fm };
    // YAML doesn't like undefined
    for (const k of Object.keys(copy)) {
        if (typeof copy[k] == 'undefined') {
            delete copy[k];
        }
    }

    return `---
${Yaml.stringify(copy, { indent: 4 }).trim()}
---
${contents}\n
`;
};
