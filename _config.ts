import lume from 'lume/mod.ts';
import postcss from 'lume/plugins/postcss.ts';
import esbuild from 'lume/plugins/esbuild.ts';
import nunjucks from 'lume/plugins/nunjucks.ts';
import date from 'lume/plugins/date.ts';
import temporalDate from './src/_lume-plugins/temporal-date.ts';
import { readingTime } from './src/_lume-plugins/reading-time.ts';
import { excerpts } from './src/_lume-plugins/excerpts.ts';
import { typeset } from './src/_lume-plugins/typeset.ts';
import cooklang from './src/_lume-plugins/cooklang.ts';
import sourceMaps from 'lume/plugins/source_maps.ts';
import { idOf, postsRoot } from './src/_includes/permalinks.ts';
import { microRoot } from './src/_includes/permalinks.ts';
import { booksRoot } from './src/_includes/permalinks.ts';
import postcssUtopia from 'npm:postcss-utopia@^1';
import { type Book, currentBookOf } from './api/model/book.ts';

const site = lume({
    src: 'src',
    dest: 'build',
    location: new URL('https://johan.im'), // Ignored in dev
});

site.use(typeset({ scope: '.prose' }))
    .use(nunjucks())
    .use(esbuild())
    .copy('public', '.')
    // Plugins
    .use(
        postcss({
            plugins: [
                postcssUtopia({
                    minWidth: 320,
                    maxWidth: 653,
                }),
            ],
        }),
    )
    .use(temporalDate())
    .use(date())
    .use(sourceMaps())
    .use(excerpts())
    .use(cooklang())
    // Helpers
    .filter('substr', (str: string, len: number) => str.substring(0, len))
    .filter('readingTime', (pageOrContent: Lume.Page | string) => {
        if (!pageOrContent) {
            throw new Error(`Passed falsy value to readingTime filter: ${pageOrContent}`);
        }

        return readingTime(pageOrContent);
    })
    .filter('postAssetUrl', (filename: string) => `/assets/posts/${filename}`)
    .filter('hostname', (url: string) => new URL(url).host.replace('www.', ''))
    .filter('mastodonUrl', function (this: ThisContext) {
        const { meta } = this.data;
        return `https://${meta.mastodon.instance}/@${meta.mastodon.username}`;
    })
    .filter('isCurrentPage', function (this: ThisContext, url: string) {
        const curr = this.data.url.replace(/\/$/, '');
        const test = url.replace(/\/$/, '');

        if (curr == test) return true;

        const parts = curr.split('/').filter(Boolean);

        if (parts.length > 1 && '/' + parts[0] == test) return true;

        return false;
    })
    .filter('groupBooksByYear', (arr: Array<Book>) => {
        const current = new Date().getUTCFullYear();
        const groups: Record<string | number, Book[]> = {
            [current]: [],
        };

        for (const a of arr) {
            const date = a.finishedAt;

            if (!date) {
                if (!a.finished) groups[current].push(a);
                continue;
            }
            if (date instanceof Date == false) {
                throw new Error(`"finishedAt" is not a date: ${date} on ${JSON.stringify(a)}`);
            }

            const group = (date as Date).getFullYear();

            if (groups[group]) groups[group].push(a);
            else groups[group] = [a];
        }

        return groups;
    })
    .filter('id', (d: Lume.Data) => {
        return idOf(d.page.sourcePath);
    })
    // Fixes `str` to be suitable for JSON output
    .filter('jsonHtml', (str: string) => JSON.stringify(str.replace('"', '"')))
    // Data
    .data('timezone', 'Europe/Stockholm') // If a page's data doesn't include a "timezone" field, we'll fall back
    .data('pageSlug', function (this: ThisContext) {
        return this.ctx.url.replaceAll('/', '');
    })
    .data('parent', function (this: ThisContext) {
        switch (this.ctx.page.data.type) {
            case 'post':
                return ['Writings', postsRoot];
            case 'note':
                return ['Micro', microRoot];
            case 'book':
                return ['Reading', booksRoot];
            default:
                return null;
        }
    })
    .data('currentBook', function (this: ThisContext<{ books: Book[] }>) {
        return currentBookOf(this.ctx.books).at(-1);
    })
    .data('layout', 'layouts/main.njk')
    // POSTS
    .data('type', 'post', '/posts')
    .data('layout', 'layouts/post.njk', '/posts')
    .data('templateEngine', 'njk,md', '/posts')
    // MICRO NOTES
    .data('type', 'note', '/notes')
    .data('layout', 'layouts/note.njk', '/notes')
    .data('templateEngine', 'njk,md', '/notes')
    // RECIPES
    .data('layout', 'layouts/reci.njk', '/recipes')
    .data('type', 'recipe', '/recipes')
    // Don't the entire site rebuild when --watching or --serving if .css files change
    .scopedUpdates((path) => path.endsWith('.css'));

export type ThisContext<T = Record<string, unknown>> = { ctx: T & Lume.Data & { page: Lume.Page }; data: Lume.Data };

export default site;
