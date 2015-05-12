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

require './helpers'

# Start benchmark
start = process.hrtime()

# Env.
isDev = process.argv[2] and process.argv[2] is '-s'
port = 8000

finished = (err) ->
  if err
    lines = if err.line and err.column then "On line #{err.line}, column #{err.column}" else ''
    console.error '✘'.red + ' ' + err.message + '. ' + lines
  else
    # Nano to ms.
    ms = (process.hrtime(start)[1] / 10e6).toFixed(2)
    console.log "#{'✔︎'.green} #{'Site built'.underline} (in #{ms}ms)\n"

METADATA =
  title: 'Johan Brook'
  description: 'The homepage and blog of Johan Brook.'
  tags: 'johan brook, web development, design, lookback'
  url: 'http://johanbrook.com'
  github: 'johanbrook'
  twitter: 'johanbrook'
  email: 'johan@johanbrook.com'


site = Metalsmith(__dirname)

  # CONFIG #######################################

  .clean true

  .metadata METADATA

  # POSTS #######################################

  .use metallic()

  .use markdown()

  .use excerpts()

  .use collections
    posts:
      pattern: 'posts/**.html'
      sortBy: 'date'
      reverse: true

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

# LOCAL DEV #######################################

if isDev
  site.use serve
    port: port


# BUILD #######################################

site.build(finished)
