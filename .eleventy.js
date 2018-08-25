const { join } = require('path');
const { buildDest: output, buildSrc } = require('./paths');
const helpers = require('./src/helpers');

const pluginRss = require('@11ty/eleventy-plugin-rss');
const readingTimePlugin = require('./src/plugins/reading-time');

const env = process.env.NODE_ENV;
const isDevelopment = env === 'development';

// https://www.11ty.io/docs/config/

module.exports = function(config) {
  Object.keys(helpers).forEach(name => {
    config.addFilter(name, helpers[name]);
  });

  // Add plugins
  config.addPlugin(pluginRss);
  config.addPlugin(readingTimePlugin);

  config.addCollection('allPosts', collection =>
    collection
      .getFilteredByTag('posts')
      .filter(post => (isDevelopment ? true : !post.data.draft))
      .reverse()
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
