import lume from 'lume/mod.ts';
import postcss from 'lume/plugins/postcss.ts';
import codeHighlight from 'lume/plugins/code_highlight.ts';
import date from 'lume/plugins/date.ts';
import inline from 'lume/plugins/inline.ts';
import postcssNested from 'https://esm.sh/postcss-nested@5';
import postcssColor from 'https://esm.sh/postcss-color-function@4';
import postcssHexRgba from 'https://esm.sh/postcss-hexrgba@2';

const dest = 'build2';

const site = lume({
  src: 'src',
  dest,
  metrics: true,
});

site
  .copy('public', '.')
  // Plugins
  .use(codeHighlight())
  .use(inline())
  .use(
    postcss({
      sourceMap: true,
      keepDefaultPlugins: true,
      plugins: [postcssNested(), postcssColor(), postcssHexRgba()],
    })
  )
  .use(date())
  // Helpers
  .filter('substr', (str: string, len: number) => str.substr(0, len))
  .filter('moreThan', (num: number, count: number) => num > count)
  // Don't the entire site rebuild when --watching or --serving if .css files change
  .scopedUpdates((path) => path.endsWith('.css'));

export default site;
