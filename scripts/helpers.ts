import { promisify } from 'util';
import glob from 'glob';
import { buildConfig } from '../config';
import chalk from 'chalk';

const { sourcePath } = buildConfig;

export const findFiles = (pattern: string) =>
  promisify(glob)(pattern, { cwd: sourcePath });

export const notify = (msg: string, colorFn = chalk.gray) =>
  console.log(colorFn(`· ${msg}`));
