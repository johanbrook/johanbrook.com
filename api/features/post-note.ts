import { Meta } from './index.ts';
import { formatDate } from '../date.ts';
import { ProblemError, ProblemKind } from '../problem.ts';
import { join } from 'path';
import { addFrontMatter } from './front-matter.ts';
import { Services } from '../services/index.ts';

interface NoteMeta extends Meta {}

export const postNote = async (connectors: Services, json: any) => {
    const { github } = connectors;

    const { contents, meta } = parseBody(json); // throws on validation errors
    const fileDate = formatDate(meta.date, true);
    const fileName = `${fileDate}.md`;

    await github.putFile(addFrontMatter(contents, meta), join('src/notes', fileName));
};

type Body = {
    contents: string;
    meta: NoteMeta;
};

const parseBody = (json: any): Body => {
    if (typeof json.contents != 'string') {
        throw new ProblemError(
            ProblemKind.BodyParseError,
            `"contents" must be a string, got ${typeof json.contents}`,
        );
    }
    if (typeof json.date != 'string') {
        throw new ProblemError(
            ProblemKind.BodyParseError,
            `"date" must be a string, got ${typeof json.date}`,
        );
    }

    if (typeof json.timezone == 'string' && !isIANATimezone(json.timezone)) {
        throw new ProblemError(
            ProblemKind.BodyParseError,
            `"${json.timezone}" isn't a correct IANA timezone`,
        );
    }

    if (
        json.tags != null &&
        (!Array.isArray(json.tags) || !(json.tags as unknown[]).every((v) => typeof v == 'string'))
    ) {
        throw new ProblemError(
            ProblemKind.BodyParseError,
            `"tags" must be a string array`,
        );
    }

    return {
        contents: json.contents,
        meta: {
            date: new Date(json.date),
            timezone: json.timezone,
            location: json.location,
            tags: json.tags,
        },
    };
};

const isIANATimezone = (str: string): boolean => {
    try {
        return !!Temporal.TimeZone.from(str);
    } catch {
        return false;
    }
};
