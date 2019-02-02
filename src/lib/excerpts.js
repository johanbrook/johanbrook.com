const excerptMinimumLength = 140;
const excerptSeparator = '<!--more-->';

module.exports = extractExcerpt;

/**
 * Extracts the excerpt from a document.
 *
 * @param {*} doc A real big object full of all sorts of information about a document.
 * @returns {String} the excerpt.
 */
function extractExcerpt(doc) {
  if (!doc.hasOwnProperty('templateContent')) {
    console.warn(
      'Failed to extract excerpt: Document has no property `templateContent`.'
    );
    return;
  }

  const content = doc.templateContent;

  if (content.includes(excerptSeparator)) {
    return content.substring(0, content.indexOf(excerptSeparator)).trim();
  } else if (content.length <= excerptMinimumLength) {
    return content.trim();
  }

  const excerptEnd = findExcerptEnd(content);
  return content
    .substring(0, excerptEnd)
    .trim()
    .replace(/<\/?p>/g, '');
}

/**
 * Finds the end position of the excerpt of a given piece of content.
 * This should only be used when there is no excerpt marker in the content (e.g. no `<!--more-->`).
 *
 * @param {String} content The full text of a piece of content (e.g. a blog post)
 * @param {Number?} skipLength Amount of characters to skip before starting to look for a `</p>`
 * tag. This is used when calling this method recursively.
 * @returns {Number} the end position of the excerpt
 */
function findExcerptEnd(content, skipLength = 0) {
  if (content === '') {
    return 0;
  }

  const paragraphEnd = content.indexOf('</p>', skipLength) + 4;

  if (paragraphEnd < excerptMinimumLength) {
    return (
      paragraphEnd +
      findExcerptEnd(content.substring(paragraphEnd), paragraphEnd)
    );
  }

  return paragraphEnd;
}
