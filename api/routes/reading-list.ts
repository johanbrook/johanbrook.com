import { ProblemError, ProblemKind } from '../problem.ts';
import { Services } from '../services/index.ts';
import * as ReadingList from '../model/reading-list.ts';

export const addToReadingList = async (services: Services, json: any) => {
    if (Array.isArray(json)) {
        const input = json.map(inputOf);
        const [books] = await ReadingList.addMany(services.fileHost, input);
        return books;
    }

    const input = inputOf(json);

    const [book] = await ReadingList.add(services.fileHost, input);
    return [book];
};

export const syncReadingListKobo = (services: Services, json: any) => {
    if (!Array.isArray(json)) {
        throw new ProblemError(
            ProblemKind.BodyParseError,
            `JSON must be an array of ReadingListBook, got ${typeof json}`,
        );
    }

    return ReadingList.syncFromKobo(services.fileHost, json.map(inputOf));
};

const inputOf = (json: any): ReadingList.Input => {
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

    if (json.isbn != null && typeof json.isbn != 'string') {
        throw new ProblemError(
            ProblemKind.BodyParseError,
            `"isbn" must be a string, got ${typeof json.isbn}`,
        );
    }

    if (json.notes != null && typeof json.notes != 'string') {
        throw new ProblemError(
            ProblemKind.BodyParseError,
            `"notes" must be a string, got ${typeof json.notes}`,
        );
    }

    if (json.source != null && typeof json.source != 'string') {
        throw new ProblemError(
            ProblemKind.BodyParseError,
            `"source" must be a string, got ${typeof json.source}`,
        );
    }

    return {
        title: json.title,
        author: json.author,
        isbn: json.isbn,
        notes: json.notes,
        source: json.source,
    };
};
