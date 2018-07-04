import path, { join } from 'path';

export type FilePath = string;

interface BuildConfig {
  /** The source directory to build from. */
  sourcePath: FilePath;
  /** The outbuild build directory. */
  outPath: FilePath;
  /** The directory we should treat as 'random public asset directory'. */
  publicDir: FilePath;
  /** Where are layout files stored? */
  layoutsPath: FilePath;
  /** Where are template files stored? */
  templatesPath: FilePath;
}

export interface MetaInfo {
  description: string;
  shortbio: string;
  url: string;
  github: string;
  twitter: string;
  tumblr: string;
  dribbble: string;
  email: string;
  linkedin: string;
  careers: string;
  cv: string;
  version: {
    currentVersion: string;
    changelog: string;
  };
}

const sourcePath = path.resolve('src');
const outPath = path.resolve('build');
const layoutsPath = join(sourcePath, 'layouts');
const templatesPath = join(sourcePath, 'templates');

export const buildConfig: BuildConfig = {
  sourcePath,
  outPath,
  publicDir: 'public',
  layoutsPath,
  templatesPath,
};

export const meta: MetaInfo = {
  description:
    "I'm a twenty-something designer and developer travelling the world. I work with the best people in a company called Lookback, where I help interfaces come to life.",
  shortbio:
    'I’m coding & designering and I like working with product, user experience, and interface design and other things too. Like everybody else here.',
  url: 'https://johanbrook.com',
  github: 'johanbrook',
  twitter: 'johanbrook',
  tumblr: 'http://log.johanbrook.com',
  dribbble: 'johan',
  email: 'johan@johanbrook.com',
  linkedin: 'http://linkedin.com/in/johanbrook',
  careers: 'https://careers.stackoverflow.com/johanbrook',
  cv: 'https://johanbrook.com/assets/johanbrook-cv.pdf',
  version: {
    currentVersion: '3.4.0',
    changelog: 'https://johanbrook.com/changelog',
  },
};
