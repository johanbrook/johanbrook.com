const gulp = require('gulp');

const copyPublic = () => gulp.src('src/public/**/*').pipe(gulp.dest('build'));

gulp.task('public', copyPublic);

module.exports = copyPublic;
