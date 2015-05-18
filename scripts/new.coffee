fs =      require 'fs'
path =    require 'path'
slug =    require 'slug'
moment =  require 'moment'
colors =  require 'colors'

DESTINATION = path.join __dirname, "../src/posts/"

title = process.argv[2] || ''

if title.indexOf('-') is 0
  arg = title
  title = process.argv[3]

title = title || 'New post'
silent = arg is '--silent'

# Create a new post with the title format:
#
#   2015-01-01-slugified-title.md
createNewPost = (title) ->
  TEMPLATE = "---\ntitle: #{title}\ndate: '#{moment().format('YYYY-MM-DD HH:mm')}'\ndraft: true
\n---\n
  \n
  "

  prefix = moment().format('YYYY-MM-DD')
  fileName = "#{prefix}-#{slug(title).toLowerCase()}.md"
  fullPath = path.join DESTINATION, fileName

  fs.writeFile fullPath, TEMPLATE, (err, res) ->
    if err
      console.error '✘'.red + ' ' + err.message
    else
      if silent
        console.log fullPath
      else
        console.log "#{'✔︎'.green} Created #{fileName.underline}"

createNewPost title
