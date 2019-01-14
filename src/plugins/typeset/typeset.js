// https://github.com/davidmerfield/Typeset
const typeset = require('typeset');

/**
 * Apply Typeset.js to HTML content.
 *
 * @param {object} options Options object to feed into Typeset.
 * @see https://github.com/davidmerfield/Typeset#options
 */
module.exports = (options) => {
  return function applyTypeset(content, outputPath) {
    if (outputPath.endsWith('.html')) {
      const result = typeset(content, options);
      return result;
    }

    return content;
  };
};
