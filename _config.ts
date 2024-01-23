import lume from 'lume/mod.ts';
import type { Page } from 'lume/core.ts';
import postcss from 'lume/plugins/postcss.ts';
import esbuild from 'lume/plugins/esbuild.ts';
import date from 'lume/plugins/date.ts';
import inline from 'lume/plugins/inline.ts';
import { readingTime } from './src/_lume-plugins/reading-time.ts';
import { extractExcerpt } from './src/_lume-plugins/excerpts.ts';
import { typeset } from './src/_lume-plugins/typeset.ts';
import sourceMaps from 'lume/plugins/source_maps.ts';
import { idOf } from './src/_includes/permalinks.ts';

const site = lume(
	{
		src: 'src',
		dest: 'build',
		location: new URL('https://johan.im'), // Ignored in dev
	}
);

site
	.includes(['.ts', '.js'], 'js')
	.includes(['.css'], 'css')
	.use(typeset({ scope: '.prose' }))
	.use(esbuild())
	.copy('public', '.')
	.copy('public/.well-known', './.well-known') // lume ignores . dirs, must copy explicitly
	// Plugins
	.use(inline())
	.use(postcss())
	.use(date())
	.use(sourceMaps())
	// Helpers
	.filter('substr', (str: string, len: number) => str.substring(0, len))
	.filter('readingTime', (pageOrContent) => {
		if (!pageOrContent) {
			throw new Error(
				`Passed falsy value to readingTime filter: ${pageOrContent}`,
			);
		}

		return readingTime(pageOrContent);
	})
	.filter('postAssetUrl', (filename) => `/assets/posts/${filename}`)
	.filter('excerpt', (content: string) => extractExcerpt(content))
	.filter('hostname', (url: string) => new URL(url).host.replace('www.', ''))
	.filter('mastodonUrl', function (this: any) {
		const { meta } = this.ctx.page.data;
		return `https://${meta.mastodon.instance}/@${meta.mastodon.username}`;
	})
	.filter('isCurrentPage', function (this: any, url: string) {
		const curr = (this.ctx.page.data.url as string).replace(/\/$/, '');
		const test = url.replace(/\/$/, '');

		return curr == test;
	})
	.filter('groupBooksByYear', <T>(arr: Array<T>) => {
	    const current = new Date().getUTCFullYear();
		const groups: Record<string | number, T[]> = {
			[current]: []
		};

		for (const a of arr) {
		    const date = a.finishedAt;

			if (!date) {
			    if (!a.finished) groups[current].push(a);
			    continue;
			}
			if (date instanceof Date == false) throw new Error(`"finishedAt" is not a date: ${date} on ${JSON.stringify(a)}`);

			const group = (date as Date).getFullYear();

			if (groups[group]) groups[group].push(a);
			else groups[group] = [a];
		}

		return groups;
	})
	.filter('id', (page: Page) => idOf(page.src.slug))
	// Fixes `str` to be suitable for JSON output
	.filter('jsonHtml', (str: string) => JSON.stringify(str.replace('"', '\"')))
	// Data
	.data('pageSlug', function (this: { ctx: { url: string } }) {
		return this.ctx.url.replaceAll('/', '');
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
