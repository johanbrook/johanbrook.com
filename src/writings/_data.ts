import type { Page } from 'lume/core.ts';

export const url = (page: Page) => `./${page.data.slug}/`;
