const YAML = require('yamljs');
const fs = require('fs');
const { join } = require('path');
const extract = require('front-matter');
const slug = require('slug');
const { unquote, quote } = require('underscore.string');

const ROOT = join(process.cwd(), 'src', 'posts');

const isPost = (filename) =>
  /\.md$/.test(filename);

const slugifyTitle = (attributes) => {
  if (!attributes.slug) {
    attributes.slug = slug(unquote(attributes.title), {lower: true});
  }

  return attributes;
};

fs.readdir(ROOT, (err, files) => {
  files.filter(isPost).forEach(filename => {
    fs.readFile(join(ROOT, filename), 'utf8', (err, data) => {
      const content = extract(data);
      const attributes = slugifyTitle(content.attributes);

      const frontmatter = YAML.stringify(attributes);
      const newContent = `---
${frontmatter}---
${content.body}`;

      fs.writeFile(join(ROOT, filename), newContent, (err) => {
        if (!err) console.log(`Wrote ${filename}`);
      });
    });
  });
});
