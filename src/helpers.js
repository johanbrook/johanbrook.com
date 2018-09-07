const moment = require('moment');
const fs = require('fs');
const joinUrl = require('url-join');

const getDeployedUrl = () => `https://${fs.readFileSync('./CNAME')}`;

const ROOT_URL = getDeployedUrl();

const escapeQuotes = text =>
  text.replace(/'/g, '&rsquo;').replace(/"/g, '&ldquo;');

module.exports = {
  icon(name) {
    return new Handlebars.SafeString(`<svg class='icon icon-${name}'>
      <use xlink:href='/assets/entypo.svg#icon-${name}'></use>
    </svg>`);
  },

  escapeQuotes,

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

  pretty: text => text.replace('index.html', ''),

  canonicalUrl: path => {
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
