const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const postcss = require('gulp-postcss');

const bundleCSS = () =>
  gulp
    .src('src/stylesheets/*.css')
    .pipe(sourcemaps.init())
    .pipe(postcss())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('build/assets/css'));

/*
  Compile CSS
*/
gulp.task('styles', bundleCSS);

module.exports = bundleCSS;
