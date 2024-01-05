import type { Page } from 'lume/core.ts';
import { urlForPost } from '../_includes/permalinks.ts';

export const url = (page: Page) => urlForPost(page.data.slug);
