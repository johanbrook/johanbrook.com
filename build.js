const Metalsmith =    require('metalsmith');
/* eslint no-unused-vars: 0 */
const colors =        require('colors');
const markdown =      require('metalsmith-markdown');
const collections =   require('metalsmith-collections');
const permalinks =    require('metalsmith-permalinks');
const templates =     require('metalsmith-in-place');
const branch =        require('metalsmith-branch');
const layouts =       require('metalsmith-layouts');
const autoprefixer =  require('metalsmith-autoprefixer');
const excerpts =      require('metalsmith-excerpts');
const metallic =      require('metalsmith-metallic');
const typography =    require('metalsmith-typography');
const feed =          require('metalsmith-feed');
const compress =      require('metalsmith-gzip');
const pagination =    require('metalsmith-pagination');
const redirect =      require('metalsmith-redirect');
const wordcount =     require('metalsmith-word-count');
const _ =             require('lodash');
const helpers =       require('./helpers');
const Handlebars =    require('handlebars');

_.each(helpers, (fn, name) => {
  Handlebars.registerHelper(name, fn);
});

// Start benchmark
const start = process.hrtime();

// Env.
const isDev = process.env.NODE_ENV === 'development';

// Load external meta.
const config = require('./src/meta.json');

const METADATA = {
  title: 'Johan Brook',
  tags: 'johan brook, web development, design, lookback, johan',
  ogImage: 'https://johanbrook.com/assets/images/og-image.png',

  // For the feed.
  site: {
    title: 'Johan Brook',
    url: 'https://johanbrook.com',
    author: 'Johan Brook'
  }
};

_.extend(METADATA, config);

// Start building!

const site = Metalsmith(__dirname)

  // CONFIG #######################################

  .clean(true)

  .metadata(METADATA)

  .concurrency(100)

  // POSTS #######################################

  .use(metallic())

  // Essentially `metalsmith-drafts` from https://github.com/segmentio/metalsmith-drafts/blob/master/lib/index.js,
  // but I needed to conditionally enable it depending on environment.
  .use((files, metal, done) => {
    if (isDev) return done();

    setImmediate(done);
    _.each(files, (file, key) => {
      if (file.draft) delete files[key];
    });
  })
  .use(markdown())

  .use(wordcount())

  .use(excerpts())

  .use(collections({
      posts: {
        pattern: 'posts/**.html',
        sortBy: 'date',
        reverse: true
      }
    })
  )

  .use(feed({ collection: 'posts' }))

  // Use typography niceties.

  .use(branch('posts/**.html').use(typography()))

  // Set post template on each post.

  .use((files, metal, done) => {
    metal.metadata().posts.forEach(post => {
      post.template = 'post.html';
      post.page = 'post';
    });

    done();
  })

  .use(branch('posts/**.html')
    .use(permalinks({ pattern: 'writings/:title', relative: false })))

  .use(branch('!posts/**.html')
    .use(branch('!index.md')
      .use(permalinks({ relative: false }))))

  .use(pagination({
    'collections.posts': {
      path: 'writings/page/:num/index.html',
      perPage: 10,
      template: 'posts.html',
      first: 'writings/index.html',
      pageMetadata: {
        page: 'posts'
      }
    }
  }))

  // TEMPLATES #######################################

  .use(templates({
    pattern: '**/*.html',
    engine: 'handlebars'
  }))

  .use(layouts({
    pattern: '**/*.html',
    engine: 'handlebars',
    default: 'layout.html'
  }))

  // REDIRECTS #######################################

  .use(redirect({
    '/articles/native-style-momentum-scrolling-to-arrive-in-ios-5':     '/writings/native-style-momentum-scrolling-to-arrive-in-ios-5/',

    '/articles/a-symbol-for-sex': '/writings/a-symbol-for-sex',
    '/articles/adding-custom-url-endpoints-in-wordpress': '/writings/adding-custom-url-endpoints-in-wordpress',
    '/articles/perfection-doesnt-exist': '/writings/perfection-doesn-t-exist',
    '/articles/css-context': '/writings/writing-contextual-css',
    '/articles/debugging-css-media-queries': '/writings/debugging-css-media-queries'
  }));

// LOCAL DEV #######################################

/*
if isDev
 site.use serve
    port: port
*/


// BUILD #######################################

const finished = (cb) => {

  return (err) => {
    if (err) {
      const lines = err.line && err.column ? `On line ${err.line}, column ${err.column}` : '';
      console.error(`${'✘'.red} ${err.message}. ${lines}`);
    } else {
      // Nano to ms.
      const ms = (process.hrtime(start)[1] / 10e6).toFixed(2);
      console.log(`${'✔︎'.green} ${'Site built'.underline} (in ${ms}ms)\n`);
    }

    cb && cb(err);
  };
};

const build = (cb) => {
  if (process.env.NODE_ENV !== 'development') {
    site.use(compress());
  }

  site.build(finished(cb));
};

module.exports = build;
