const gulp = require('gulp');
const shell = require('gulp-shell');

const generate = shell.task('eleventy');

/*
 Run our static site generator to build the pages
*/
gulp.task('generate', generate);

module.exports = generate;
