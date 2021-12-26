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

  for (const data of paginate(posts, { url: urlForPosts, size: 30 })) {
    yield data;
  }
}
