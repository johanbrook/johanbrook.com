const gulp = require('gulp');
const clean = require('gulp-clean');

// cleanup the build output
gulp.task('clean', () =>
  gulp.src('build', { allowEmpty: true, read: false }).pipe(clean())
);
