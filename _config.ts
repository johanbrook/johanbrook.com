import lume from 'lume/mod.ts';
import postcss from 'lume/plugins/postcss.ts';
import bundler from 'lume/plugins/bundler.ts';
import date from 'lume/plugins/date.ts';
import inline from 'lume/plugins/inline.ts';
import { minifier } from './deps.ts';
import { readingTime } from './src/_lume-plugins/reading-time.ts';
import { extractExcerpt } from './src/_lume-plugins/excerpts.ts';
import { loadLanguages, prismMarkdown } from './src/_lume-plugins/prism.ts';

const DEST = 'build';
const MINIFY = Deno.env.get('ENV') == 'production';

loadLanguages();

const site = lume(
    {
        src: 'src',
        dest: DEST,
    },
    {
        markdown: {
            options: {
                highlight: prismMarkdown,
            },
        },
    }
);

const NUMERIC = 'yyyyMMddHHmm';

site
    //
    .includes(['.ts', '.js'], 'lib')
    .includes(['.css'], 'css')
    .use(
        bundler({
            sourceMap: true,
            options: {
                bundle: 'module',
            },
        })
    )
    .copy('public', '.')
    // Plugins
    .use(inline())
    .use(
        postcss({
            sourceMap: true,
        })
    )
    .use(
        date({
            formats: {
                NUMERIC,
            },
        })
    )
    // Helpers
    .filter('substr', (str: string, len: number) => str.substring(0, len))
    .filter('readingTime', (pageOrContent) => {
        if (!pageOrContent)
            throw new Error(
                `Passed falsy value to readingTime filter: ${pageOrContent}`
            );

        return readingTime(pageOrContent);
    })
    .filter('postAssetUrl', (filename) => `/assets/posts/${filename}`)
    .filter('excerpt', (content: string) => extractExcerpt(content))
    .filter('hostname', (url: string) => new URL(url).host)
    // Data
    .data('pageSlug', function (this: { ctx: { url: string } }) {
        return this.ctx.url.replaceAll('/', '');
    })
    // Don't the entire site rebuild when --watching or --serving if .css files change
    .scopedUpdates((path) => path.endsWith('.css'));

if (MINIFY) {
    site.addEventListener('afterBuild', () => {
        console.log('Minifying CSS…');
        minifyCss();
    });
}

const minifyCss = () => {
    const css = Deno.readTextFileSync(`./${DEST}/johan.css`);
    const minified = minifier.minify('css', css);
    Deno.writeTextFileSync(`./${DEST}/johan.css`, minified);
};

export default site;
