const gulp = require('gulp');

const watch = () => {
  gulp.watch('src/stylesheets/**/*.scss', gulp.parallel('styles'));
  gulp.watch('src/public/**/*', gulp.parallel('public'));
  gulp.watch('src/site/**/*', gulp.parallel('generate'));
};

/*
  Watch folders for changess
*/
gulp.task('watch', watch);

module.exports = watch;
