const gulp = require('gulp');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');

const compileSass = () =>
  gulp
    .src('src/stylesheets/*.scss')
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        outputStyle:
          process.env.NODE_ENV === 'development' ? 'expanded' : 'compressed',
      }).on('error', sass.logError)
    )
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('build/assets/css'));

/*
  Compile SCSS files to CSS
*/
gulp.task('styles', compileSass);

module.exports = compileSass;
