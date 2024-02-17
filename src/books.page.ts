import { urlForBook } from './_includes/permalinks.ts';

export const layout = 'layouts/book.njk';

interface BookData extends Lume.Data {
    books: Array<Book>;
}

export interface Book {
    title: string;
    slug: string;
    author: string;
    finished?: boolean;
    finishedAt?: boolean;
    dropped?: boolean;
    paused?: boolean;
    notes?: string;
    location?: string;
}

export default function* (data: BookData) {
    for (const book of data.books) {
        yield {
            ...book,
            url: urlForBook(book),
        };
    }
}
