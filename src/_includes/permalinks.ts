import * as path from 'std/path/mod.ts';
import type { Book } from '../books.page.ts';

// This file controls permalink schemes across various resources

export const postsRoot = '/writings';
export const microRoot = '/micro';
export const booksRoot = '/reading';

// For a singular post, we do: /writings/:slug
export const urlForPost = (slug: string) => `${postsRoot}/${slug}/`;

export const idOf = (sourcePath: string) => path.basename(sourcePath).replaceAll('-', '').split('.').at(0)!;

export const notePermalinkOf = (fileName: string) => `${microRoot}/${idOf(fileName)}/`;

export const urlForBook = (book: Book) => `${booksRoot}/${book.slug}/`;
