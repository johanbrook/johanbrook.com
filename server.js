const path = require('path');
const watch = require('metalsmith-simplewatch');
const build = require('./build.js');

watch({
  port: process.env.npm_package_config_port || process.env.PORT || 8000,
  buildFn: build,
  buildPath: path.resolve(__dirname, './build/'),
  srcPath: path.resolve(__dirname),
  pattern: [
    'src/**/*',
    'templates/*.html',
    'layouts/*.html'
  ]
});
