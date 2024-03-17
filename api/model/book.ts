import { ProblemError, ProblemKind } from '../problem.ts';
import { FileHost } from '../services/index.ts';
import { join } from 'std/path/mod.ts';
import * as Yaml from 'std/yaml/mod.ts';
import { slug } from 'slug';

const BOOKS_PATH = 'src/_data/books.yml';

export interface Book {
    title: string;
    slug: string;
    author: string;
    finished?: boolean;
    finishedAt?: Date;
    dropped?: boolean;
    paused?: boolean;
    notes?: string;
    location?: string;
}

export const findCurrent = async (store: FileHost): Promise<Book[]> => {
    const raw = await store.getFile(BOOKS_PATH);

    return booksArrayOf(raw).filter((b) => !b.finished && !b.dropped && !b.paused);
};

export const findBySlug = async (
    store: FileHost,
    slug: string,
): Promise<[book: Book | null, index: number]> => {
    const raw = await store.getFile(BOOKS_PATH);
    const books = booksArrayOf(raw);

    const idx = books.findIndex((b) => b.slug == slug);
    const book = books[idx];

    return book ? [book, idx] : [null, idx];
};

export const update = async (store: FileHost, idx: number, book: Book) => {
    const raw = await store.getFile(BOOKS_PATH);
    const books = booksArrayOf(raw);
    books[idx] = book;

    await store.putFile(
        // stringify() _does_ accept an array, but the types say no...
        // @ts-ignore-next
        Yaml.stringify(books),
        join(BOOKS_PATH),
    );
};

export interface BookInput {
    title: string;
    author: string;
}

export const add = async (store: FileHost, input: BookInput): Promise<[Book, string]> => {
    const book: Record<string, string> & Book = {
        title: input.title,
        author: input.author,
        slug: slug(input.title),
    };

    const raw = await store.getFile(BOOKS_PATH);

    // @ts-ignore-next
    const str = Yaml.stringify([book]);

    const final = raw + '\n' + str;

    const fullPath = await store.putFile(
        final,
        join(BOOKS_PATH),
    );

    return [book, fullPath];
};

const booksArrayOf = (raw: string): Book[] => {
    const books = Yaml.parse(raw);

    if (!Array.isArray(books)) {
        throw new ProblemError(ProblemKind.InconsistentFile, `${BOOKS_PATH} isn't a YAML array`);
    }

    return books as Book[];
};
