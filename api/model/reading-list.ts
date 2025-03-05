import { ProblemError, ProblemKind } from '../problem.ts';
import { FileHost } from '../services/index.ts';
import * as Yaml from 'jsr:@std/yaml';
import { slug } from 'slug';
import { join } from 'std/path/mod.ts';

const READING_LIST_PATH = 'src/_data/reading_list.yml';

export interface ReadingListBook {
    title: string;
    author: string;
    notes?: string;
    addedAt?: Date;
    isbn?: string;
}

export const findAll = async (store: FileHost): Promise<ReadingListBook[]> => {
    const raw = await store.getFile(READING_LIST_PATH);

    if (!raw) return [];

    return booksArrayOf(raw);
};

export const add = async (store: FileHost, input: ReadingListBook): Promise<[ReadingListBook, string]> => {
    const books = await findAll(store);

    if (books.find((b) => slug(b.title) == slug(input.title))) {
        throw new ProblemError(
            ProblemKind.BadInput,
            `A book with that slug already exists: ${input.title}`,
        );
    }

    const raw = await store.getFile(READING_LIST_PATH);

    const str = Yaml.stringify([input]);

    const final = raw + '\n' + str;

    const fullPath = await store.putFile(
        final,
        join(READING_LIST_PATH),
    );

    return [input, fullPath];
};

export const addMany = async (store: FileHost, todo: ReadingListBook[]) => {
    if (!todo.length) return 0;

    const raw = await store.getFile(READING_LIST_PATH);

    const str = Yaml.stringify(todo);

    const final = raw + '\n' + str;

    await store.putFile(
        final,
        join(READING_LIST_PATH),
    );

    return todo.length;
};

const booksArrayOf = (raw: string): ReadingListBook[] => {
    const books = Yaml.parse(raw);

    if (!Array.isArray(books)) {
        throw new ProblemError(ProblemKind.InconsistentFile, `${READING_LIST_PATH} isn't a YAML array`);
    }

    return books as ReadingListBook[];
};
