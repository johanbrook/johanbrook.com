const build =     require('./build.js');
const gulp        = require('gulp');
const browserSync = require('browser-sync').create('johanbrook.com');
const sass        = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');

const src = {
    scss: 'src/assets/stylesheets/**/*.scss',
    css:  'build/assets/stylesheets',
    content: [
      'templates/*.html',
      'layouts/*.html',
      'src/posts/*.md',
      'src/*.md'
    ]
};

// Static Server + watching scss/html files
gulp.task('serve', ['sass'], function() {
    build(() => {
      browserSync.init({
        server: './build'
      });

      compileSass();

      gulp.watch(src.scss, ['sass']);
      gulp.watch(src.content).on('change', () => build(() => {
        compileSass();
        browserSync.reload();
      }));
    });
});

// Compile sass into CSS

function compileSass() {
  return gulp.src(src.scss)
      .pipe(sourcemaps.init())
      .pipe(sass({
        includePaths: [
          'src/assets/stylesheets',
          './node_modules/tachyons/src'
        ],
        outputStyle: 'compressed'
      }))
      .pipe(autoprefixer())
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(src.css))
      .pipe(browserSync.stream());
}

gulp.task('sass', compileSass);

gulp.task('default', ['sass', 'serve']);

// We must build Sass after the main site build, to avoid overwrites.
gulp.task('build', () => build(compileSass));
