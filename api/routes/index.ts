export { postNote } from './note.ts';
export { addBook, finishBook, getCurrentBook } from './book.ts';

/** Common fields for pages. */
export interface Meta {
    [index: string]: unknown;
    date: Date;
    location?: string;
    tags?: string[];
    timezone?: string;
}
