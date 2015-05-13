Metalsmith =    require 'metalsmith'
colors =        require 'colors'
markdown =      require 'metalsmith-markdown'
collections =   require 'metalsmith-collections'
permalinks =    require 'metalsmith-permalinks'
templates =     require 'metalsmith-templates'
branch =        require 'metalsmith-branch'
layouts =       require 'metalsmith-layouts'
autoprefixer =  require 'metalsmith-autoprefixer'
sass =          require 'metalsmith-sass'
serve =         require 'metalsmith-serve'
excerpts =      require 'metalsmith-excerpts'
metallic =      require 'metalsmith-metallic'
copy =          require 'metalsmith-copy'
typography =    require 'metalsmith-typography'
drafts =        require 'metalsmith-drafts'
feed =          require 'metalsmith-feed'
compress =      require 'metalsmith-gzip'
pagination =    require 'metalsmith-pagination'
redirect =      require 'metalsmith-redirect'
_ =             require 'lodash'

require './helpers'

# Start benchmark
start = process.hrtime()

# Env.
isDev = process.argv[2] and process.argv[2] is '-s'
port = 8000

# Load external meta.
config = require './src/meta.json'

METADATA =
  title: 'Johan Brook'
  tags: 'johan brook, web development, design, lookback'
  description: "I'm a twenty-something web designer and developer living in Gothenburg, Sweden. I work with the best people in the world at Lookback."
  ogImage: 'http://johanbrook.com/assets/images/og-image.png'

  # For the feed.
  site:
    title: 'Johan Brook'
    url: 'http://johanbrook.com'
    author: 'Johan Brook'

_.extend(METADATA, config)

site = Metalsmith(__dirname)

  # CONFIG #######################################

  .clean true

  .metadata METADATA

  # POSTS #######################################

  # # Make posts available in .text format for the same permalink.
  # .use copy
  #   pattern: 'posts/*.md'
  #   directory: 'writings'
  #   transform: (file) ->
  #     file
  #       .replace(/(posts)\/\d{4}-\d{2}-\d{2}-/g, 'writings/')  # Remove date, replace 'posts'
  #       .replace(/md|markdown/, 'text') # Replace .md/.markdown with .text.

  .use metallic()

  .use drafts()

  .use markdown()

  .use excerpts()

  .use collections
    posts:
      pattern: 'posts/**.html'
      sortBy: 'date'
      reverse: true

  .use feed(collection: 'posts')

  # Use typography niceties.

  .use branch('posts/**.html').use(typography())

  # Set post template on each post.

  .use (files, metal, done) ->
    metal.metadata().posts.forEach (post) ->
      post.template = 'post.html'
      post.page = 'post'
    done()

  .use branch('posts/**.html').use(
      permalinks(pattern: 'writings/:title', relative: false)
    )

  .use branch('!posts/**.html').use branch('!index.md').use permalinks
    relative: false

  .use pagination
    'collections.posts':
      path: 'writings/page/:num/index.html'
      perPage: 10
      template: 'posts.html'
      first: 'writings/index.html'
      pageMetadata:
        page: 'posts'

  # TEMPLATES #######################################

  .use templates
    pattern: '**/*.html'
    engine: 'handlebars'

  .use layouts
    pattern: '**/*.html'
    engine: 'handlebars'
    default: 'layout.html'

  # ASSETS #######################################

  .use sass
    includePaths: ['src/assets/stylesheets']
    outputStyle: 'compressed'

  .use autoprefixer()

  # REDIRECTS #######################################

  .use redirect
    '/articles/native-style-momentum-scrolling-to-arrive-in-ios-5': '/writings/native-style-momentum-scrolling-to-arrive-in-ios-5/'

    '/articles/a-symbol-for-sex': '/writings/a-symbol-for-sex'
    '/articles/adding-custom-url-endpoints-in-wordpress': '/writings/adding-custom-url-endpoints-in-wordpress'
    '/articles/perfection-doesnt-exist': '/writings/perfection-doesn-t-exist'
    '/about.html': '/about'
    '/articles/css-context': '/writings/writing-contextual-css'
    '/articles/debugging-css-media-queries': '/writings/debugging-css-media-queries'

# LOCAL DEV #######################################

if isDev
  site.use serve
    port: port

if !isDev
  site
    .use compress()


# BUILD #######################################

finished = (err) ->
  if err
    lines = if err.line and err.column then "On line #{err.line}, column #{err.column}" else ''
    console.error '✘'.red + ' ' + err.message + '. ' + lines
  else
    # Nano to ms.
    ms = (process.hrtime(start)[1] / 10e6).toFixed(2)
    console.log "#{'✔︎'.green} #{'Site built'.underline} (in #{ms}ms)\n"


site.build(finished)
