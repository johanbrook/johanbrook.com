import { ProblemError, ProblemKind } from '../problem.ts';
import { Services } from '../services/index.ts';
import { safeTemporalZonedDateTime } from '../date.ts';
import * as Books from '../model/book.ts';

export const getCurrentBook = (services: Services) => {
    return Books.findCurrent(services.github).then(([book]) => book);
};

export const addBook = async (services: Services, json: any) => {
    const input = bookInputOf(json);

    return await Books.add(services.github, input);
};

export const finishBook = async (services: Services, slug: string, json: any) => {
    const { github } = services;

    const [book, idx] = await Books.findBySlug(github, slug);

    if (!book) {
        throw new ProblemError(ProblemKind.NotFound, `No book with slug: ${slug}`);
    }

    const body = finishBookParseBody(json);

    book.finished = true;
    book.finishedAt = body.finishedAt as any;
    book.location = body.location;
    book.timezone = body.timezone;

    await Books.update(services.github, idx, book);

    return book;
};

interface Body {
    finishedAt: string; // ISO 8601
    timezone?: string;
    location?: string;
}

// TODO abstract
const finishBookParseBody = (json: any): Body => {
    if (typeof json.finishedAt != 'string') {
        throw new ProblemError(
            ProblemKind.BodyParseError,
            `"finishedAt" must be a string, got ${typeof json.finishedAt}`,
        );
    }

    const zonedDateTime = ((): Temporal.ZonedDateTime => {
        if (typeof json.finishedAt != 'string') {
            throw new ProblemError(
                ProblemKind.BodyParseError,
                `"finishedAt" must be a string, got ${typeof json.finishedAt}`,
            );
        }

        const res = safeTemporalZonedDateTime(json.finishedAt);

        if (!res) {
            throw new ProblemError(
                ProblemKind.BodyParseError,
                `${json.finishedAt} isn't a valid Temporal.ZonedDateTime`,
            );
        }

        return res;
    })();

    return {
        finishedAt: zonedDateTime.toPlainDateTime().toString(),
        location: json.location,
        timezone: zonedDateTime.timeZone.toString(),
    };
};

const bookInputOf = (json: any): Books.BookInput => {
    if (typeof json.title != 'string') {
        throw new ProblemError(
            ProblemKind.BodyParseError,
            `"title" must be a string, got ${typeof json.title}`,
        );
    }

    if (typeof json.author != 'string') {
        throw new ProblemError(
            ProblemKind.BodyParseError,
            `"author" must be a string, got ${typeof json.author}`,
        );
    }

    return {
        title: json.title,
        author: json.author,
    };
};
