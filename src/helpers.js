const moment = require('moment');
const fs = require('fs');
const joinUrl = require('url-join');

const getDeployedUrl = () => `https://${fs.readFileSync('./CNAME')}`;

const ROOT_URL = getDeployedUrl();

const escapeQuotes = (text) =>
  text.replace(/'/g, '&rsquo;').replace(/"/g, '&ldquo;');

const includes = (arr, item) =>
  Array.isArray(arr) ? arr.includes(item) : false;

module.exports = {
  icon(name) {
    return new Handlebars.SafeString(`<svg class='icon icon-${name}'>
      <use xlink:href='/assets/entypo.svg#icon-${name}'></use>
    </svg>`);
  },

  escapeQuotes,

  getContext() {
    return this.ctx;
  },

  includes,

  includesThen(arr, item, val1, val2) {
    return includes(arr, item) ? val1 : val2;
  },

  isMicroUpdate(post) {
    return !!post && !!post.data && post.data.category === 'Updates';
  },

  formatDate(date, format) {
    if (!date) return;
    return moment(date).format(format);
  },

  niceDate(date, includeTime = true) {
    if (!date) return;
    return moment(date).format(
      includeTime ? 'MMMM D, YYYY – HH:mm' : 'MMMM D, YYYY'
    );
  },

  toISODate(date) {
    if (!date) return;
    return moment(date).toISOString();
  },

  toRelativeDate(date) {
    if (!date) return;
    return moment(date).fromNow();
  },

  pretty: (text) => text.replace('index.html', ''),

  canonicalUrl: (path) => {
    return typeof path === 'string' ? joinUrl(ROOT_URL, path) : ROOT_URL;
  },

  isCurrentNav(page, options) {
    if (page) {
      const cond = Array.isArray(page)
        ? page.indexOf(this.page) !== -1
        : page === this.page;

      return cond ? options.fn(this) : options.inverse(this);
    }
  },
};
