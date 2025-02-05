import lume from 'lume/mod.ts';
import postcss from 'lume/plugins/postcss.ts';
import nunjucks from 'lume/plugins/nunjucks.ts';
import date from 'lume/plugins/date.ts';
import temporalDate from './src/_lume-plugins/temporal-date.ts';
import { readingTime } from './src/_lume-plugins/reading-time.ts';
import { excerpts } from './src/_lume-plugins/excerpts.ts';
import { typeset } from './src/_lume-plugins/typeset.ts';
import cooklang from './src/_lume-plugins/cooklang.ts';
import sourceMaps from 'lume/plugins/source_maps.ts';
import sitemap from 'lume/plugins/sitemap.ts';
import { idOf, postsRoot } from './src/_includes/permalinks.ts';
import { microRoot } from './src/_includes/permalinks.ts';
import { booksRoot } from './src/_includes/permalinks.ts';
import postcssUtopia from 'npm:postcss-utopia@^1';
import nesting from 'npm:postcss-nesting@^12';
import { type Book, currentBookOf } from './api/model/book.ts';
import { feeds } from './_feeds.ts';
import codeHighlight from 'lume/plugins/code_highlight.ts';
import { maybeSaveTodo } from './_syndicate.ts';

const site = lume({
    src: 'src',
    dest: 'build',
    location: new URL('https://johan.im'), // Ignored in dev
});

site.use(typeset({ scope: '.prose' }))
    .use(nunjucks())
    .use(codeHighlight())
    .copy('public', '.')
    .use(feeds())
    .use(sitemap())
    .use(
        postcss({
            plugins: [
                nesting(),
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
    .filter('groupBooksByYear', (arr: Array<Book>): Array<{ year: string; books: Book[] }> => {
        const current = new Date().getUTCFullYear();
        const groups: Record<string, Book[]> = {
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

            const group = (date as Date).getFullYear().toString();

            if (groups[group]) groups[group].push(a);
            else groups[group] = [a];
        }

        return Object.entries(groups).map(([k, v]) => ({
            year: k,
            books: v,
        })).sort((a, b) => b.year.localeCompare(a.year));
    })
    .filter('id', (d: Lume.Data) => {
        return idOf(d.page.sourcePath);
    })
    // Fixes `str` to be suitable for JSON output
    .filter('jsonHtml', (str: string) => JSON.stringify(str.replace('"', '"')))
    // Data
    .data('pageSlug', function (this: ThisContext) {
        return this.ctx.url.replaceAll('/', '');
    })
    .data('isCSSNakedDay', () => {
        // https://css-naked-day.github.io
        const now = new Date();

        return now.getMonth() == 3 && now.getDate() == 9;
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
    // Don't rebuild the entire site rebuild when --watching or --serving if .css files change
    .scopedUpdates((path) => path.endsWith('.css'))
    // Support skip links with #main on <main>. Main!
    .process(['.html'], (pages) => {
        for (const page of pages) {
            const doc = page.document;

            const main = doc?.querySelector('main');

            if (main) {
                main.id = 'main';
            }
        }
    })
    .addEventListener('afterBuild', async (evt) => {
        const latestNote = evt.pages
            //
            .filter((t) => t.data.type == 'note')
            .sort((a, b) => a.data.date.getTime() - b.data.date.getTime())
            .at(-1);

        if (!latestNote) return;

        await maybeSaveTodo(latestNote);
    });

export type ThisContext<T = Record<string, unknown>> = { ctx: T & Lume.Data & { page: Lume.Page }; data: Lume.Data };

export default site;
