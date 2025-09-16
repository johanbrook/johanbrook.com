import { ProblemError, ProblemKind } from '../problem.ts';
import { FileHost } from '../services/index.ts';
import { yamlParse, yamlStringify } from '../yaml.ts';
import { slug } from 'slug';
import { join } from 'std/path/mod.ts';

const READING_LIST_PATH = 'src/_data/reading_list.yml';

type Path = string;
/** How I added the thing to read. */
type Source = 'kobo' | 'manual';

export interface ReadingListBook {
    title: string;
    author: string;
    notes?: string;
    addedAt?: Date;
    isbn?: string;
    source?: Source;
}

export interface Input {
    title: string;
    author: string;
    notes?: string;
    addedAt?: Date;
    isbn?: string;
    source?: Source;
}

export const findAll = async (store: FileHost): Promise<ReadingListBook[]> => {
    const raw = await store.getFile(READING_LIST_PATH);

    if (!raw) return [];

    return booksArrayOf(raw);
};

export const add = async (store: FileHost, input: Input): Promise<[ReadingListBook, Path]> => {
    const books = await findAll(store);

    if (books.find((b) => slug(b.title) == slug(input.title))) {
        throw new ProblemError(
            ProblemKind.BadInput,
            `A book with that slug already exists: ${input.title}`,
        );
    }

    const raw = await store.getFile(READING_LIST_PATH);

    const str = yamlStringify([input]);

    const final = raw + '\n' + str;

    const fullPath = await store.putFile(
        final,
        join(READING_LIST_PATH),
        `Add book to reading list: ${input.title}`,
    );

    return [input, fullPath];
};

export const addMany = async (store: FileHost, todo: ReadingListBook[]): Promise<[ReadingListBook[], Path]> => {
    if (!todo.length) throw new ProblemError(ProblemKind.BadInput, `todo can't be empty`);

    const raw = await store.getFile(READING_LIST_PATH);

    const str = yamlStringify(todo);

    const final = raw + '\n' + str;

    const fullPath = await store.putFile(
        final,
        join(READING_LIST_PATH),
        `Add many to reading list: ${todo.map((b) => b.title).join(', ')}`,
    );

    return [todo, fullPath];
};

/** Adds/removes many in batch. */
export const syncFromKobo = async (store: FileHost, todo: Input[]) => {
    const raw = await store.getFile(READING_LIST_PATH);

    if (!raw) return false;

    const existing = booksArrayOf(raw);

    const keep: ReadingListBook[] = [];
    const add: ReadingListBook[] = [];

    const isSame = <T extends { title: string }>(a: T, b: T) => slug(a.title) == slug(b.title);

    const findBySlug = <T extends { title: string }>(arr: T[], e: T) =>
        //
        arr.find((t) => isSame(e, t));

    for (const e of existing) {
        const isInWishlist = findBySlug(todo, e);

        if (e.source == 'kobo') {
            if (isInWishlist) keep.push(e);
        } else {
            keep.push(e);
        }
    }

    for (const t of todo) {
        const exists = findBySlug(keep, t);

        if (!exists) add.push(t);
    }

    const final = [...keep, ...add];

    if (listsEquals(existing, final, isSame)) {
        console.debug('syncFromKobo: existing and final lists are equal. Bailing.');
        return false;
    }

    const str = yamlStringify(final);

    await store.putFile(
        str,
        join(READING_LIST_PATH),
        `Sync Kobo to reading list: ${final.map((b) => b.title).join(', ')}`,
    );

    return true;
};

const booksArrayOf = (raw: string): ReadingListBook[] => {
    const books = yamlParse(raw);

    if (!Array.isArray(books)) {
        throw new ProblemError(ProblemKind.InconsistentFile, `${READING_LIST_PATH} isn't a YAML array`);
    }

    return books as ReadingListBook[];
};

const listsEquals = <T>(l1: T[], l2: T[], pred: (a: T, b: T) => boolean): boolean => {
    if (l1.length != l2.length) return false;

    for (let i = 0; i < l1.length; i++) {
        const a = l1[i];
        const b = l2[i];

        if (!pred(a, b)) return false;
    }

    return true;
};
