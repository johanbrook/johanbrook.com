const Handlebars =    require('handlebars');
const moment =        require('moment');

module.exports = {

  icon(name) {
    return new Handlebars.SafeString(`<svg class='icon icon-${name}'>
      <use xlink:href='/assets/entypo.svg#icon-${name}'></use>
    </svg>`);
  },

  formatDate(date, format) {
    if (!date) return;
    return moment(date).format(format);
  },

  niceDate(date) {
    if (!date) return;
    return moment(date).format('MMMM D, YYYY');
  },

  toISODate(date) {
    if (!date) return;
    return moment(date).toISOString();
  },

  toRelativeDate(date) {
    if (!date) return;
    return moment(date).fromNow();
  },

  isSingle(opts) {
    return (this.template === 'post.html') ? opts.fn(this) : opts.inverse(this);
  },

  isPage(page) {
    return page === this.page;
  },

  descriptionOrExcerpt() {
    // Strip HTML tags.
    return (this.excerpt || this.description).replace(/(<([^>]+)>)/ig, '');
  },

  pretty(text) {
    return text.replace('index.html', '');
  },

  canonicalUrl(path) {
    var root = 'http://www.johanbrook.com/';
    return (path) ? `${root}${path}/` : root;
  },

  isCurrentNav(page, options) {
    const aliases = {
      posts: 'posts',
      home: 'home',
      about: 'about'
    };

    const slug = aliases[page];

    if (slug) {
      const cond = Array.isArray(slug) ? slug.indexOf(this.page) !== -1 : slug === this.page;

      return (cond) ? options.fn(this) : options.inverse(this);
    }
  }
};
