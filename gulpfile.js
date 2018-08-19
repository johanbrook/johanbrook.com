const gulp = require('gulp');

require('require-dir')('./gulp-tasks');

gulp.task('assets', gulp.parallel('styles', 'public'));

gulp.task('build', gulp.series('clean', 'generate', 'assets'));
