const readingTime = require('./reading-time');

module.exports = function(eleventyConfig, pluginNamespace) {
  eleventyConfig.namespace(pluginNamespace, () => {
    eleventyConfig.addNunjucksFilter('readingTime', readingTime);
  });
};
