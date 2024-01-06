import type { Page } from 'lume/core.ts';
import { notePermalinkOf } from '../_includes/permalinks.ts';

// Public, for template use

export const url = (page: Page) => notePermalinkOf(page.src.slug);
