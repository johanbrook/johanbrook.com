import lume from 'lume/mod.ts';
import postcss from 'lume/plugins/postcss.ts';
import codeHighlight from 'lume/plugins/code_highlight.ts';
import date from 'lume/plugins/date.ts';
import inline from 'lume/plugins/inline.ts';
import { minify } from './deps.ts';
import { readingTime } from './src/_includes/plugins/reading-time.ts';

const DEST = 'build';
const MINIFY = Deno.env.get('ENV') == 'production';
const CI = !!Deno.env.get('CI');

if (CI) {
    console.log('Start site build…');
}

const site = lume({
    src: 'src',
    dest: DEST,
    metrics: CI,
});

site.copy('public', '.')
    // Plugins
    .use(codeHighlight())
    .use(inline())
    .use(
        postcss({
            sourceMap: true,
        })
    )
    .use(date())
    // Helpers
    .filter('substr', (str: string, len: number) => str.substring(0, len))
    .filter('moreThan', (num: number, count: number) => num > count)
    .filter('readingTime', (pageOrContent) => {
        if (!pageOrContent)
            throw new Error(
                `Passed falsy value to readingTime filter: ${pageOrContent}`
            );

        return readingTime(pageOrContent);
    })
    .filter('postAssetUrl', (filename) => `/assets/posts/${filename}`)
    .data('slug', function (this: { ctx: { url: string } }) {
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
    const css = Deno.readTextFileSync(`./${DEST}/css/johan.css`);
    const minified = minify('css', css);
    Deno.writeTextFileSync(`./${DEST}/css/johan.css`, minified);
};

export default site;
