// This file controls permalink schemes across various resources

// For a singular post, we do: /writings/:slug
export const urlForPost = (slug: string) => `/writings/${slug}/`;

export const idOf = (fileName: string) => fileName.replaceAll('-', '').split('.').at(0);

export const notePermalinkOf = (fileName: string) => `/mind/${idOf(fileName)}/`;
