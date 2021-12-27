import type { Paginator } from 'lume/plugins/paginate.ts';
import type { Search } from 'lume/plugins/search.ts';
import { urlForPosts } from './_includes/permalinks.ts';

export const layout = 'layouts/posts.njk';
export const title = 'Writings';
export default function* ({
  search,
  paginate,
}: {
  search: Search;
  paginate: Paginator;
}) {
  const posts = search.pages('type=post', 'date=desc');

  for (const result of paginate(posts, { url: urlForPosts, size: 30 })) {
    // Show the first page in the menu
    if (result.pagination.page == 1) {
      (result as unknown as any).menu = {
        visible: true,
        order: 0,
      };
    }

    yield result;
  }
}
