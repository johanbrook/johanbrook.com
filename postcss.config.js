module.exports = (ctx) => ({
  plugins: [
    require('postcss-import')(),
    require('postcss-nested')(),
    require('postcss-color-function')(),
    require('postcss-hexrgba')(),
    require('autoprefixer')(),
    ...(ctx.env === 'production' ? require('cssnano')() : []),
  ],
});
