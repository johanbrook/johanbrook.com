# Import Jkyll posts into Metalsmith
#
# Usage:
#
#   coffee script/import.coffee <path-to-source-post-dir>
#
# By Johan Brook

path =   require 'path'
extract =   require 'front-matter'
q =      require 'q'
fs =     require 'q-io/fs'
FS =     require 'fs'        # Node FS
moment = require 'moment'
yamljs = require 'yamljs'
_ =      require('underscore.string')

DESTINATION = path.join __dirname, "../src/posts/"
IMPORT_PATH = ""

print = console.log.bind(console, "· ")

init = (import_path) ->
  IMPORT_PATH = path.resolve __dirname, path.relative(__dirname, import_path)

  fs.list(IMPORT_PATH).then (files) ->
    print "Reading #{files.length} Markdown posts from " + IMPORT_PATH

    q.all(files.map(write_post)).then (files) ->
      print "Wrote #{files.length} posts to #{DESTINATION}"

write_post = (file_name) ->
  file = path.join IMPORT_PATH, file_name

  fs.read(file).then(format_yaml).then (content) ->
    file_name = file_name.replace '.markdown', '.md'
    fs.write(path.join(DESTINATION, file_name), content)

format_yaml = (content) ->
  yaml = extract(content)
  metadata = yaml.attributes

  delete metadata.layout
  delete metadata.type
  delete metadata.published

  # delete :status, :wordpress_url, :published
  for prop in ['status', 'wordpress_url', 'published']
    delete metadata[prop]

  # Long date => YYYY-mm-dd HH:mm
  metadata.date = moment(metadata.date).format("YYYY-MM-DD HH:mm")

  # unquote :date, :link
  metadata.date = _.unquote metadata.date, "'"
  metadata.title = _.unquote metadata.title, "'"
  metadata.link = _.unquote metadata.link, "'" if metadata.link?

  # delete empty :tags, :categories
  for prop in ['categories', 'tags']
    delete metadata[prop] if metadata[prop].length is 0

  categories = metadata.categories
  metadata.category = categories[0] if categories.length
  delete metadata.categories

  """
  ---
  #{yamljs.stringify(metadata)}---

  #{yaml.body}
  """

init(process.argv[2])
