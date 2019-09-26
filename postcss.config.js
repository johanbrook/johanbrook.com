const purgecss = require('@fullhuman/postcss-purgecss')({
  content: [
    './src/site/**/*.njk',
    './src/site/**/*.md',
    './src/site/**/*.html',
  ],

  // Include any special characters you're using in this regular expression
  defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
});

const minify = require('cssnano')({
  preset: 'default',
});

module.exports = (ctx) => ({
  plugins: [
    require('postcss-import')(),
    require('postcss-nested')(),
    require('postcss-color-function')(),
    require('postcss-hexrgba')(),
    require('autoprefixer')(),
    ...(ctx.env === 'production' ? [purgecss] : []),
    ...(ctx.env === 'production' ? [minify] : []),
  ],
});
