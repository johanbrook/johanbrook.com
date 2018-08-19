const gulp = require('gulp');
const server = require('browser-sync').create();
const compileSass = require('./styles');
const generate = require('./generate');
const copyPublic = require('./copy-public');

const { buildDest } = require('../paths');

const reload = done => {
  server.reload();
  done();
};

const injectSass = () => compileSass().pipe(server.reload({ stream: true }));

const watch = done => {
  gulp.watch('src/stylesheets/**/*.scss', gulp.parallel(injectSass));
  gulp.watch('src/public/**/*', gulp.series(copyPublic, reload));
  gulp.watch('src/site/**/*', gulp.series(generate, reload));
  done();
};

const serve = done => {
  server.init({
    server: { baseDir: buildDest },
  });

  done();
};

gulp.task(
  'serve',
  gulp.series(gulp.parallel(generate, copyPublic, compileSass), serve, watch)
);
