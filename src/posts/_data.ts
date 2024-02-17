import { urlForPost } from '../_includes/permalinks.ts';

export const url = (page: Lume.Page) => urlForPost(page.data.slug);
