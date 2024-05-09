import { FileHost } from '../services/index.ts';
import { join } from 'std/path/mod.ts';
import * as Yaml from 'std/yaml/mod.ts';
import { test as hasFrontMatter } from 'std/front_matter/mod.ts';
import * as fm from 'std/front_matter/any.ts';
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

/** What note is appended to for updates to what media I've been consuming during the past week/month/whatever. */
const CURRENT_NOTE = '_CURRENT.md';
const CURRENT_NOTE_TAG = 'recently';
const CURRENT_NOTE_HEADING = '## Uncategorised';

export const add = async (host: FileHost, input: NoteInput): Promise<[Note, string]> => {
    // Will be the filename: "2024-03-15-10-24-35"
    const fileDate = formatFileName(input.zonedDateTime);

    const note = noteOf(`${fileDate}.md`, input);

    const filePath = await host.putFile(
        addFrontMatter(note.contents, note.meta),
        join(NOTES_PATH, note.fileName),
    );

    return [note, filePath];
};

export const appendToCurrent = async (host: FileHost, input: NoteInput): Promise<[Note, string]> => {
    // Always append special tag:
    input.tags = [...input.tags ?? [], CURRENT_NOTE_TAG];

    const filePath = join(NOTES_PATH, CURRENT_NOTE);

    const current = await host.getFile(filePath);

    const contentsOf = (existing: string = ''): string => {
        existing = existing.trim();

        if (!existing.includes(CURRENT_NOTE_HEADING)) {
            return `${existing}

${CURRENT_NOTE_HEADING}

- ${input.contents}`.trim();
        }

        return `${existing}\n- ${input.contents}`.trim();
    };

    // Add new
    if (!current) {
        const note = noteOf(CURRENT_NOTE, input);
        const contents = contentsOf();

        const filePath = await host.putFile(
            addFrontMatter(contents, note.meta),
            join(NOTES_PATH, note.fileName),
        );

        return [note, filePath];
    } else {
        // Append
        const existingBody = (() => {
            if (hasFrontMatter(current)) {
                return fm.extract<Meta>(current).body;
            }

            return current;
        })();

        const newContents = contentsOf(existingBody);

        const note = noteOf(CURRENT_NOTE, input);

        const filePath = await host.putFile(
            addFrontMatter(newContents, note.meta),
            join(NOTES_PATH, note.fileName),
        );

        return [note, filePath];
    }
};

const noteOf = (fileName: string, input: NoteInput): Note => {
    return {
        contents: input.contents,
        fileName,
        meta: {
            // Will go into the frontmatter: "2024-03-15T10:24:35+01:00".
            // For practical reasons, I store the "dumb" date in the `date` field and the timezone
            // separately. I *could've* put them both as an ISO8601 string with timezone information
            // appended à la Temporal, but I'm not sure my current or future site generators will
            // play well with that, since `date` tend to be a spEcIal fIeLd.
            date: formatISO(
                input.zonedDateTime,
            ),
            location: input.location,
            timezone: input.zonedDateTime.timeZoneId.toString(),
            tags: input.tags,
        },
    };
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
