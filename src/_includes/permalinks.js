const basename = (path, ext) => {
    const base =
        path
            .replace(/[/\\]+$/, '')
            .split(/[/\\]/)
            .pop() ?? '';
    if (ext && base.endsWith(ext)) return base.slice(0, -ext.length);
    return base;
};

// This file controls permalink schemes across various resources

export const postsRoot = '/writings';
export const microRoot = '/micro';
export const booksRoot = '/reading';

// For a singular post, we do: /writings/:slug
export const urlForPost = (slug) => `${postsRoot}/${slug}/`;

export const idOf = (sourcePath) => basename(sourcePath).replaceAll('-', '').split('.').at(0);

export const notePermalinkOf = (fileName) => `${microRoot}/${idOf(fileName)}/`;

export const urlForBook = (book) => `${booksRoot}/${book.slug}/`;
