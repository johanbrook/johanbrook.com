import type { Page } from 'lume/core.ts';

// This file controls permalink schemes across various resources

// Posts

// For the posts archive, we do: /writings/[:page]
export const urlForPosts = (n: number) =>
  n == 1 ? '/writings/' : `/writings/${n}/`;

// For a singular post, we do: /writings/:slug
export const urlForPost = (page: Page) => `/writings/${page.data.slug}/`;
