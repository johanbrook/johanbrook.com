Handlebars =    require 'handlebars'
moment =        require 'moment'
_ =             require 'lodash'

Helpers =
  formatDate: (date, format) ->
    return if not date
    moment(date).format(format)

  niceDate: (date) ->
    return if not date
    moment(date).format 'MMMM D, YYYY'

  toISODate: (date) ->
    return if not date
    moment(date).toISOString()

  isPage: (page) ->
    page is @page

  pretty: (text) ->
    text.replace 'index.html', ''

  canonicalUrl: (path) ->
    root = 'http://www.johanbrook.com/'
    if path then "#{root}#{path}/" else root

  isCurrentNav: (page, options) ->
    aliases =
      posts: 'posts'
      home: 'home'
      about: 'about'

    slug = aliases[page]

    if slug
      cond = if Array.isArray(slug) then slug.indexOf(@page) isnt -1 else slug is @page

      if cond
        options.fn(this)
      else
        options.inverse(this)


_.each Helpers, (fn, name) ->
  Handlebars.registerHelper(name, fn)
