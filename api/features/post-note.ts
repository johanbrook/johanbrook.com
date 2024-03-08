import { AppHandler, Meta } from './index.ts';
import { formatDate } from '../date.ts';
import { ProblemError, ProblemKind } from '../problem.ts';
import { join } from 'path';
import { addFrontMatter } from './front-matter.ts';

interface NoteMeta extends Meta {}

export const postNote: AppHandler = async (connectors, req) => {
    const { github } = connectors;

    const { contents, ...meta } = await parseBody(req);
    const fileDate = formatDate(meta.date, true);
    const fileName = `${fileDate}.md`;

    await github.putFile(addFrontMatter(contents, meta), join('src/notes', fileName));

    return new Response('Note posted', { status: 200 });
};

type Body = NoteMeta & {
    contents: string;
};

const parseBody = async (req: Request): Promise<Body> => {
    const json = await req.json();

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

    return {
        contents: json.contents,
        date: new Date(json.date),
        timezone: json.timezone,
        location: json.location,
        tags: json.tags,
    };
};

const isIANATimezone = (str: string): boolean => {
    try {
        return !!Temporal.TimeZone.from(str);
    } catch {
        return false;
    }
};
