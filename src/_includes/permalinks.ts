import * as path from 'path';
import type { Book } from '../books.page.ts';

// This file controls permalink schemes across various resources

// For a singular post, we do: /writings/:slug
export const urlForPost = (slug: string) => `/writings/${slug}/`;

export const idOf = (sourcePath: string) =>
    path.basename(sourcePath).replaceAll('-', '').split('.').at(0);

export const notePermalinkOf = (fileName: string) => `/micro/${idOf(fileName)}/`;

export const urlForBook = (book: Book) => `/reading/${book.slug}/`;
