import { FileHost } from '../services/index.ts';
import { join } from 'std/path/mod.ts';
import * as Yaml from 'std/yaml/mod.ts';
import { formatFileName, formatISO } from '../date.ts';

export interface Note {
    contents: string;
    fileName: string;
    meta: Meta;
}

export interface Meta {
    [index: string]: unknown;
    date: string;
    location?: string;
    tags?: string[];
    timezone?: string;
}

export interface NoteInput {
    [index: string]: unknown;
    contents: string;
    zonedDateTime: Temporal.ZonedDateTime;
    location?: string;
    tags?: string[];
}

const NOTES_PATH = 'src/notes';

export const add = async (host: FileHost, input: NoteInput): Promise<[Note, string]> => {
    // Will go into the frontmatter: "2024-03-15T10:24:35+01:00".
    // For practical reasons, I store the "dumb" date in the `date` field and the timezone
    // separately. I *could've* put them both as an ISO8601 string with timezone information
    // appended à la Temporal, but I'm not sure my current or future site generators will
    // play well with that, since `date` tend to be a spEcIal fIeLd.
    const metaDate = formatISO(
        input.zonedDateTime,
    );
    // Will be the filename: "2024-03-15-10-24-35"
    const fileDate = formatFileName(input.zonedDateTime);

    const note: Note = {
        contents: input.contents,
        fileName: `${fileDate}.md`,
        meta: {
            date: metaDate,
            location: input.location,
            timezone: input.zonedDateTime.timeZoneId.toString(),
            tags: input.tags,
        },
    };

    const filePath = await host.putFile(
        addFrontMatter(note.contents, note.meta),
        join(NOTES_PATH, note.fileName),
    );

    return [note, filePath];
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
