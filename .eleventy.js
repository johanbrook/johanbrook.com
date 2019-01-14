const { join } = require('path');
const { buildDest: output, buildSrc } = require('./paths');
const helpers = require('./src/helpers');

const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const pluginRss = require('@11ty/eleventy-plugin-rss');
const readingTimePlugin = require('eleventy-plugin-reading-time');
const typesetPlugin = require('./src/plugins/typeset');

const env = process.env.NODE_ENV;
const isDevelopment = env === 'development';

// https://www.11ty.io/docs/config/

module.exports = function(config) {
  Object.keys(helpers).forEach((name) => {
    config.addFilter(name, helpers[name]);
  });

  // Add plugins
  config.addPlugin(pluginRss);
  config.addPlugin(readingTimePlugin);
  config.addPlugin(syntaxHighlight);
  config.addPlugin(
    typesetPlugin({
      only: '.article-text',
      disable: ['smallCaps'],
    })
  );

  return {
    dir: {
      input: join(buildSrc, 'site'),
      output,
    },
    templateFormats: ['njk', 'md'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    passthroughFileCopy: true,
  };
};
