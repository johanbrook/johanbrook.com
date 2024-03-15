export { postNote } from './note.ts';
export { addBook, finishBook, getCurrentBooks } from './book.ts';

/** Common fields for pages. */
export interface Meta {
    [index: string]: unknown;
    date: string;
    location?: string;
    tags?: string[];
    timezone?: string;
}
