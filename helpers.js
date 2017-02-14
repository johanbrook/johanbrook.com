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
    return (this.excerpt || this.description || '').replace(/(<([^>]+)>)/ig, '');
  },

  pretty(text) {
    return text.replace('index.html', '');
  },

  canonicalUrl(path) {
    const root = 'https://www.johanbrook.com/';
    return (path) ? `${root}${path}/` : root;
  },

  isCurrentNav(page, options) {
    if (page) {
      const cond = Array.isArray(page) ? page.indexOf(this.page) !== -1 : page === this.page;

      return (cond) ? options.fn(this) : options.inverse(this);
    }
  }
};
