import { safeTemporalZonedDateTime } from '../date.ts';
import { ProblemError, ProblemKind } from '../problem.ts';
import { Services } from '../services/index.ts';
import { notePermalinkOf } from '../../src/_includes/permalinks.ts';
import * as Notes from '../model/note.ts';

export const postNote = async (services: Services, json: any) => {
    const input = inputOf(json); // throws on validation errors

    const [note] = await Notes.add(services.fileHost, input);

    return new URL(notePermalinkOf(note.fileName), self.location.href);
};

function assert<T>(v: any, type: string, err: () => Error): asserts v is T {
    if (typeof v != type) {
        throw err();
    }
}

const inputOf = (json: any): Notes.NoteInput => {
    const { contents, date } = json;

    assert<string>(contents, 'string', () =>
        new ProblemError(
            ProblemKind.BodyParseError,
            `"contents" must be a string, got ${typeof json.contents}`,
        ));

    if (contents.trim().length == 0) {
        new ProblemError(
            ProblemKind.BodyParseError,
            `"contents" must be be non-zero string`,
        );
    }

    const zonedDateTime = ((): Temporal.ZonedDateTime => {
        assert<string>(date, 'string', () =>
            new ProblemError(
                ProblemKind.BodyParseError,
                `"date" must be a string, got ${typeof json.date}`,
            ));

        const res = safeTemporalZonedDateTime(date);

        if (!res) {
            throw new ProblemError(
                ProblemKind.BodyParseError,
                `${date} isn't a valid Temporal.ZonedDateTime`,
            );
        }

        return res;
    })();

    const tags = ((): string[] | undefined => {
        if (!json.tags) return undefined;

        if (Array.isArray(json.tags)) return json.tags;

        if (typeof json.tags == 'string') {
            return (json.tags as string).split(',').map((s) => s.trim());
        }

        throw new ProblemError(
            ProblemKind.BodyParseError,
            `"tags" must be a string array or comma separated string`,
        );
    })();

    return {
        contents: contents.trim(),
        zonedDateTime,
        location: json.location,
        tags,
    };
};
