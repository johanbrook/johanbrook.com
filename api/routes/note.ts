import { formatFileName, formatISO, safeTemporalZonedDateTime } from '../date.ts';
import { ProblemError, ProblemKind } from '../problem.ts';
import { Services } from '../services/index.ts';
import { notePermalinkOf } from '../../src/_includes/permalinks.ts';
import * as Notes from '../model/note.ts';

export const postNote = async (services: Services, json: any) => {
    const note = inputOf(json); // throws on validation errors

    await Notes.add(services.github, note);

    return new URL(notePermalinkOf(note.fileName), self.location.href);
};

function assert<T>(v: any, type: string, err: () => Error): asserts v is T {
    if (typeof v != type) {
        throw err();
    }
}

const inputOf = (json: any): Notes.Note => {
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

    // I want both of these to be in the *local* time:

    // Will go into the frontmatter: "2024-03-15T10:24:35+01:00"
    const metaDate = formatISO(
        zonedDateTime,
    );
    // Will be the filename: "2024-03-15-10-24-35"
    const fileDate = formatFileName(zonedDateTime);

    return {
        contents: contents.trim(),
        fileName: `${fileDate}.md`,
        meta: {
            // For practical reasons, I store the "dumb" date in the `date` field and the timezone
            // separately. I *could've* put them both as an ISO8601 string with timezone information
            // appended à la Temporal, but I'm not sure my current or future site generators will
            // play well with that, since `date` tend to be a spEcIal fIeLd.
            date: metaDate,
            timezone: zonedDateTime.timeZone.toString(),
            location: json.location,
            tags,
        },
    };
};
