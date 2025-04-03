import { ProblemError, ProblemKind } from '../problem.ts';
import { Services } from '../services/index.ts';
import * as ReadingList from '../model/reading-list.ts';

export const addToReadingList = async (services: Services, json: any) => {
    const input = inputOf(json);

    return await ReadingList.add(services.fileHost, input);
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

    return {
        title: json.title,
        author: json.author,
        isbn: json.isbn,
        notes: json.notes,
    };
};
