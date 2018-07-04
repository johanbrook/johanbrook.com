import path, { join } from 'path';
import { promisify } from 'util';
import { FilePath, buildConfig } from '../../config';
import sass from 'node-sass';
import { findFiles, notify } from '../helpers';
import chalk from 'chalk';
import fse from 'fs-extra';

const { outPath, sourcePath } = buildConfig;

const renderSass = promisify(sass.render);

const sassOptions: sass.Options = {
  includePaths: [path.resolve('./node_modules/tachyons/src')],
  outputStyle: 'compressed',
};

export default async function buildSass({
  sassLocation,
  cssDestination,
}: {
  sassLocation: FilePath;
  cssDestination: FilePath;
}) {
  const sassFiles = await findFiles(join(sassLocation, '!(_)*.scss'));

  notify(`${chalk.white('Rendering')} Sass (${sassFiles.join(', ')})…`);

  try {
    for (const file of sassFiles) {
      const result = await renderSass({
        ...sassOptions,
        file: join(sourcePath, file),
      });

      await fse.outputFile(
        join(outPath, cssDestination, `${path.parse(file).name}.css`),
        result.css
      );
    }
  } catch (ex) {
    const err = ex as sass.SassError;

    const error = new Error(ex.formatted);
    error.name = err.name;
    error.stack = err.stack;

    throw error;
  }
}
