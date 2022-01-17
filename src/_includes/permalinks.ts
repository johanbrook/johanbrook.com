import type { Page } from 'lume/core.ts';

// This file controls permalink schemes across various resources

// Posts

// For a singular post, we do: /writings/:slug
export const urlForPost = (page: Page) => `/writings/${page.data.slug}/`;
