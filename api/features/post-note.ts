import { AppHandler, Meta } from './index.ts';
import { formatDate } from '../date.ts';
import { ProblemError, ProblemKind } from '../problem.ts';
import { join } from 'path';

interface NoteMeta extends Meta {}

export const postNote: AppHandler = async (connectors, req) => {
    const { github } = connectors;

    const { contents, ...meta } = await parseBody(req);
    const fileDate = formatDate(meta.date, true);
    const fileName = `${fileDate}.md`;

    await github.putFile<NoteMeta>(contents, join('src/notes', fileName), meta);

    return new Response('Note posted', { status: 200 });
};

type ParsedBody = NoteMeta & {
    contents: string;
};

const parseBody = async (req: Request): Promise<ParsedBody> => {
    const json = await req.json();

    if (typeof json.contents != 'string') {
        throw new ProblemError(ProblemKind.BodyParseError, `"contents" must be a string`);
    }
    if (typeof json.date != 'string') {
        throw new ProblemError(ProblemKind.BodyParseError, `"date" must be a string`);
    }

    return {
        contents: json.contents,
        date: new Date(json.date),
    };
};
