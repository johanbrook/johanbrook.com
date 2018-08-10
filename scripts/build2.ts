import fse from 'fs-extra';
import chalk from 'chalk';
import { buildConfig, meta, FilePath, MetaInfo } from '../config';
import xs, { Stream } from 'xstream';
import frontmatter from 'front-matter';
import path, { join } from 'path';
import { findFiles } from './helpers';
import slugify from 'slug';

const {
  sourcePath,
  outPath,
  publicDir,
  layoutsPath,
  templatesPath,
} = buildConfig;

enum Order {
  ASC,
  DESC,
}

interface PageMeta {
  title: string;
  template?: string;
  date?: Date;
  category?: string;
  tags?: [string];
  slug?: string;
  link?: string;
  draft?: boolean;
}

type TemplateData = PageMeta | MetaInfo;

interface File extends PageMeta {
  path: FilePath;
  url: string;
  slug: string;
  date: Date;
  contents: string;
}

interface CollectionItem {
  directoryName: string;
  template: string;
  permalink?: string;
  indexTemplate?: {
    path: FilePath;
    permalink: string;
    ordering?: {
      sortBy: 'date' | 'title';
      order: Order;
    };
  };
}

const page$: CollectionItem = {
  directoryName: '_pages',
  template: 'page',
};

const post$: CollectionItem = {
  directoryName: '_posts',
  template: 'post',
  permalink: '/writings/:slug',
  indexTemplate: {
    path: join(templatesPath, 'posts.html.ejs'),
    permalink: '/writings',
    ordering: {
      sortBy: 'date',
      order: Order.DESC,
    },
  },
};

async function collectAttributes(filePath: FilePath): Promise<TemplateData> {
  const fileData = path.parse(filePath);
  const fileContents = await fse.readFile(join(sourcePath, filePath), 'utf-8');
  const pageData = frontmatter<PageMeta>(fileContents);

  const { title = fileData.name, slug: theSlug } = pageData.attributes;

  const slug = theSlug || slugify(title);

  return {
    ...meta,
    ...pageData.attributes,
    slug,
  };
}

function readFiles(pattern: string) {
  return (item$: Stream<CollectionItem>) =>
    item$.map(async item => {
      const promise = await findFiles(join(item.directoryName, pattern));

      const files = await promise;
      return files.map(f => collectAttributes(f));
    });
}

async function main(startStream$: Stream<CollectionItem>) {
  return startStream$.compose(readFiles('*.@(md|ejs|html|json)'));
}

process.on('unhandledRejection', (err, promise) => {
  console.error('⚠️ Oh no, something was rejected!');
  console.error(chalk.red(err.stack || err));
  process.exit(1);
});

main(xs.merge(xs.of(page$), xs.of(post$))).catch(err => {
  console.error('❌ Oops, something went wrong while building:');
  console.error(chalk.red(err.stack || err));
  process.exit(1);
});
