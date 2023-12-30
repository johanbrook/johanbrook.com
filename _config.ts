import lume from 'lume/mod.ts';
import postcss from 'lume/plugins/postcss.ts';
import esbuild from 'lume/plugins/esbuild.ts';
import date from 'lume/plugins/date.ts';
import inline from 'lume/plugins/inline.ts';
import minifyHTML from 'lume/plugins/minify_html.ts';
import { minifier } from './deps.ts';
import { readingTime } from './src/_lume-plugins/reading-time.ts';
import { extractExcerpt } from './src/_lume-plugins/excerpts.ts';
import { loadLanguages, prismMarkdown } from './src/_lume-plugins/prism.ts';
import { typeset } from './src/_lume-plugins/typeset.ts';
import sourceMaps from 'lume/plugins/source_maps.ts';

const DEST = 'build';
const MINIFY = Deno.env.get('ENV') == 'production';

loadLanguages();

const site = lume(
	{
		src: 'src',
		dest: DEST,
		location: new URL('https://johan.im'), // Ignored in dev
	},
	{
		markdown: {
			options: {
				highlight: prismMarkdown,
			},
		},
	},
);

const NUMERIC = 'yyyyMMddHHmm';

site
	//
	.includes(['.ts', '.js'], 'js')
	.includes(['.css'], 'css')
	.use(typeset({ scope: '.prose' }))
	.use(esbuild())
	.copy('public', '.')
	// Plugins
	.use(inline())
	.use(postcss())
	.use(
		date({
			formats: {
				NUMERIC,
			},
		}),
	)
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
	// Data
	.data('pageSlug', function (this: { ctx: { url: string } }) {
		return this.ctx.url.replaceAll('/', '');
	})
	.data('layout', 'layouts/main.njk')
	.data('type', 'post', '/posts')
	.data('layout', 'layouts/post.njk', '/posts')
	.data('templateEngine', 'njk,md', '/posts')
	.data('type', 'note', '/notes')
	.data('layout', 'layouts/post.njk', '/notes')
	.data('templateEngine', 'njk,md', '/notes')
	// Don't the entire site rebuild when --watching or --serving if .css files change
	.scopedUpdates((path) => path.endsWith('.css'));

if (MINIFY) {
	site.addEventListener('afterBuild', () => {
		console.log('Minifying CSS…');
		minifyCss();
	});

	site.use(minifyHTML());
}

const minifyCss = () => {
	const css = Deno.readTextFileSync(`./${DEST}/johan.css`);
	const minified = minifier.minify('css', css);
	Deno.writeTextFileSync(`./${DEST}/johan.css`, minified);
};

export default site;
