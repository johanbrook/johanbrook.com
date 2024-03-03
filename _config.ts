import lume from 'lume/mod.ts';
import postcss from 'lume/plugins/postcss.ts';
import esbuild from 'lume/plugins/esbuild.ts';
import inline from 'lume/plugins/inline.ts';
import nunjucks from 'lume/plugins/nunjucks.ts';
import temporalDate from './src/_lume-plugins/temporal-date.ts';
import { readingTime } from './src/_lume-plugins/reading-time.ts';
import { extractExcerpt } from './src/_lume-plugins/excerpts.ts';
import { typeset } from './src/_lume-plugins/typeset.ts';
import sourceMaps from 'lume/plugins/source_maps.ts';
import { idOf, postsRoot } from './src/_includes/permalinks.ts';
import { microRoot } from './src/_includes/permalinks.ts';
import { booksRoot } from './src/_includes/permalinks.ts';
import postcssUtopia from 'npm:postcss-utopia@^1';

const site = lume({
    src: 'src',
    dest: 'build',
    location: new URL('https://johan.im'), // Ignored in dev
});

site.use(typeset({ scope: '.prose' }))
    .use(nunjucks())
    .use(esbuild())
    .copy('public', '.')
    .copy('public/.well-known', './.well-known') // lume ignores . dirs, must copy explicitly
    // Plugins
    .use(inline())
    .use(
        postcss({
            plugins: [
                postcssUtopia({
                    minWidth: 320,
                    maxWidth: 653,
                }),
            ],
        })
    )
    .use(temporalDate())
    .use(sourceMaps())
    // Helpers
    .filter('substr', (str: string, len: number) => str.substring(0, len))
    .filter('readingTime', (pageOrContent: Lume.Page | string) => {
        if (!pageOrContent) {
            throw new Error(`Passed falsy value to readingTime filter: ${pageOrContent}`);
        }

        return readingTime(pageOrContent);
    })
    .filter('postAssetUrl', (filename: string) => `/assets/posts/${filename}`)
    .filter('excerpt', (content: string) => extractExcerpt(content))
    .filter('hostname', (url: string) => new URL(url).host.replace('www.', ''))
    .filter('mastodonUrl', function (this: any) {
        const { meta } = this.ctx.page.data;
        return `https://${meta.mastodon.instance}/@${meta.mastodon.username}`;
    })
    .filter('isCurrentPage', function (this: any, url: string) {
        const curr = (this.ctx.page.data.url as string).replace(/\/$/, '');
        const test = url.replace(/\/$/, '');

        if (curr == test) return true;

        const parts = curr.split('/').filter(Boolean);

        if (parts.length > 1 && '/' + parts[0] == test) return true;

        return false;
    })
    .filter('groupBooksByYear', <T,>(arr: Array<T>) => {
        const current = new Date().getUTCFullYear();
        const groups: Record<string | number, T[]> = {
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
    .filter('id', (d: Lume.Data) => idOf(d.page.sourcePath))
    // Fixes `str` to be suitable for JSON output
    .filter('jsonHtml', (str: string) => JSON.stringify(str.replace('"', '"')))
    // Data
    .data('timezone', 'Europe/Stockholm') // If a page's data doesn't include a "timezone" field, we'll fall back
    .data('pageSlug', function (this: { ctx: { url: string } }) {
        return this.ctx.url.replaceAll('/', '');
    })
    .data('parent', function (this: { ctx: { page: Lume.Page } }) {
        const { page } = this.ctx;

        switch (page.data.type) {
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
    .data('layout', 'layouts/main.njk')
    .data('type', 'post', '/posts')
    .data('layout', 'layouts/post.njk', '/posts')
    .data('templateEngine', 'njk,md', '/posts')
    .data('type', 'note', '/notes')
    .data('layout', 'layouts/note.njk', '/notes')
    .data('templateEngine', 'njk,md', '/notes')
    // Don't the entire site rebuild when --watching or --serving if .css files change
    .scopedUpdates((path) => path.endsWith('.css'));

export default site;
