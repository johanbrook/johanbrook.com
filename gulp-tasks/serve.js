const gulp = require('gulp');
const server = require('browser-sync').create();
const css = require('./styles');
const generate = require('./generate');
const copyPublic = require('./copy-public');

const { buildDest } = require('../paths');

const reload = (done) => {
  server.reload();
  done();
};

const injectCss = () => css().pipe(server.reload({ stream: true }));

const watch = (done) => {
  gulp.watch('src/stylesheets/**/*.css', gulp.parallel(injectCss));
  gulp.watch('src/public/**/*', gulp.series(copyPublic, reload));
  gulp.watch('src/site/**/*', gulp.series(generate, reload));
  done();
};

const serve = (done) => {
  server.init({
    server: { baseDir: buildDest },
  });

  done();
};

gulp.task(
  'serve',
  gulp.series(gulp.parallel(generate, copyPublic, css), serve, watch)
);
