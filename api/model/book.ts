import { ProblemError, ProblemKind } from '../problem.ts';
import { FileHost } from '../services/index.ts';
import { join } from 'std/path/mod.ts';
import { yamlParse, yamlStringify } from '../yaml.ts';
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

    if (!raw) return [];

    return currentBookOf(booksArrayOf(raw));
};

// Assumes sorted array
export const currentBookOf = (books: Book[]): Book[] => books.filter((b) => !b.finished && !b.dropped && !b.paused);

export const findBySlug = async (
    store: FileHost,
    slug: string,
): Promise<[book: Book | null, index: number]> => {
    const books = await findAll(store);

    const idx = books.findIndex((b) => b.slug == slug);
    const book = books[idx];

    return book ? [book, idx] : [null, idx];
};

export const findAll = async (store: FileHost): Promise<Book[]> => {
    const raw = await store.getFile(BOOKS_PATH);

    if (!raw) return [];

    return booksArrayOf(raw);
};

export const update = async (store: FileHost, idx: number, book: Book) => {
    const books = await findAll(store);
    books[idx] = book;

    await store.putFile(
        yamlStringify(books),
        join(BOOKS_PATH),
        `Update book: ${book.title}`,
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

    const books = await findAll(store);

    if (books.find((b) => b.slug == book.slug)) {
        throw new ProblemError(
            ProblemKind.BadInput,
            `A book with that slug already exists: ${book.slug}`,
        );
    }

    const raw = await store.getFile(BOOKS_PATH);

    const str = yamlStringify([book]);

    const final = raw + '\n' + str;

    const fullPath = await store.putFile(
        final,
        join(BOOKS_PATH),
        `Add book: ${book.title}`,
    );

    return [book, fullPath];
};

const booksArrayOf = (raw: string): Book[] => {
    const books = yamlParse(raw);

    if (!Array.isArray(books)) {
        throw new ProblemError(ProblemKind.InconsistentFile, `${BOOKS_PATH} isn't a YAML array`);
    }

    return books as Book[];
};
