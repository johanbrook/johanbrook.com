import { buildConfig, meta, FilePath, MetaInfo } from '../config';
import fse from 'fs-extra';
import chalk from 'chalk';
import path, { join } from 'path';
import frontmatter from 'front-matter';
import marked from 'marked';
import ejs from 'ejs';
import slugify from 'slug';
import { notify, findFiles } from './helpers';
import buildSass from './plugins/sass';

const verbose = process.argv[2] === '--verbose';

const INDEX = 'index.html';

/* TODO

  - [x] Custom templates & layouts
  - [x] Permalinks
  - [x] Posts index page
  - [ ] Ordering
  - [ ] Pagination
  - [ ] Drafts
  - [ ] Sass rendering/minification
  - [ ] EJS helpers
*/

const {
  sourcePath,
  outPath,
  publicDir,
  layoutsPath,
  templatesPath,
} = buildConfig;

interface PageMeta {
  title: string;
  template?: string;
  date?: Date;
  category?: string;
  tags?: [string];
  slug?: string;
  link?: string;
  [index: string]: any;
}

interface File {
  path: FilePath;
  url: string;
  slug: string;
  date: Date;
  title: string;
  contents: string;
  draft?: boolean;
  link?: string;
  tags?: [string];
  category?: string;
}

interface IndexTemplateData {
  files: File[];
}

type TemplateData = PageMeta | MetaInfo | path.ParsedPath | IndexTemplateData;

enum Order {
  ASC = 'asc',
  DESC = 'desc',
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

notify(`Reading from\t${chalk.magenta(sourcePath)}`);
notify(`Writing to\t${chalk.magenta(outPath)}`);

notify("Let's go!\n", chalk.bold);

async function clean() {
  notify(`${chalk.white('Cleaning')} ${outPath} dir…`);
  await fse.emptyDir(outPath);
}

function copyPublicDir() {
  notify(`${chalk.white('Copying')} ${publicDir} dir…`);
  fse.copy(join(sourcePath, publicDir), outPath);
}

function buildPermalinkDestination(
  fileData: path.ParsedPath,
  collectionItem: CollectionItem,
  pageData: PageMeta
): { path: FilePath; url: string } {
  // Skip subdir if name is something like index.md
  // Becomes `subdir` as URL.
  if (fileData.name === 'index') {
    return {
      path: join(outPath, INDEX),
      url: '/',
    };
  }

  // Build permalink according to pattern in the CollectionItem.
  // Becomes like: `some-slug/index.html`:
  if (collectionItem.permalink) {
    const urlPath = collectionItem.permalink.replace(
      /:([\w-]+)/g,
      (_, pageProp) => {
        if (pageData[pageProp]) {
          return slugify(pageData[pageProp] as string);
        }

        throw Error(
          `${pageProp} doesn't exist on item! ${JSON.stringify(
            {
              fileData,
              collectionItem,
            },
            null,
            4
          )}`
        );
      }
    );

    return {
      url: urlPath,
      path: join(outPath, urlPath, INDEX),
    };
  }

  // Transform `something.md` to `something/index.html`.
  // URL becomes `/something`
  return {
    url: `/${slugify(fileData.name)}`,
    path: join(outPath, fileData.name, INDEX),
  };
}

interface RenderProps {
  data?: TemplateData;
  body?: string;
}

function render(
  layoutPath: FilePath,
  props: RenderProps = {}
): Promise<string> {
  return fse
    .readFile(layoutPath, 'utf-8')
    .then(contents =>
      ejs.render(
        contents,
        {
          ...props.data,
          body: props.body,
        },
        { async: true }
      )
    )
    .catch(err => {
      console.error(chalk.red(`Error when rendering ${layoutPath}:`));
      console.error(chalk.red(err.stack || err));
      return `<h1>Rendering Error</h1><pre>${err.stack || err}</pre>`;
    });
}

async function renderInLayout(
  templatePath: FilePath,
  layoutPath: FilePath,
  props: RenderProps = {}
): Promise<string> {
  const templatedBody = await render(templatePath, props);

  return await render(layoutPath, {
    body: templatedBody,
    data: props.data,
  });
}

async function buildFile(
  filePath: FilePath,
  collectionItem: CollectionItem
): Promise<File> {
  const fileData = path.parse(filePath);
  const fileContents = await fse.readFile(join(sourcePath, filePath), 'utf-8');
  const pageData = frontmatter<PageMeta>(fileContents);

  const templateData: TemplateData = {
    ...fileData,
    ...meta,
    ...pageData.attributes,
  };

  const {
    title = fileData.name,
    date = new Date(),
    slug: theSlug,
    category,
    link,
    tags,
  } = pageData.attributes;

  const slug = theSlug || slugify(title);

  pageData.attributes.slug = slug;

  const body = (() => {
    switch (fileData.ext) {
      case '.md':
        return marked(pageData.body);
      case '.ejs':
        return ejs.render(pageData.body, templateData);
      default:
        return pageData.body;
    }
  })();

  const completePage = await renderInLayout(
    join(
      templatesPath,
      `${templateData.template || collectionItem.template}.html.ejs`
    ),
    join(layoutsPath, `${templateData.layout || 'layout'}.html.ejs`),
    { body, data: templateData }
  );

  const { path: fileDestination, url } = buildPermalinkDestination(
    fileData,
    collectionItem,
    pageData.attributes
  );

  await fse.outputFile(fileDestination, completePage);

  const file: File = {
    url,
    slug,
    date,
    title,
    path: fileDestination,
    contents: body,
    category,
    link,
    tags,
  };

  return file;
}

async function buildCollections(
  collections: CollectionItem[]
): Promise<File[]> {
  return Promise.all(
    collections.map(async item => {
      const collectionFiles = await findFiles(
        join(item.directoryName, '*.@(md|ejs|html|json)')
      );

      notify(
        `${chalk.white('Building')} ${collectionFiles.length} files in ${
          item.directoryName
        }…`
      );

      const done = Promise.all(
        collectionFiles.map(file => buildFile(file, item))
      );

      if (item.indexTemplate) {
        const files = await done;

        if (item.indexTemplate.ordering) {
          const { sortBy, order } = item.indexTemplate.ordering;

          notify(
            `${chalk.white('Sorting')} ${
              item.directoryName
            } by ${sortBy}, ${order} order…`
          );

          files.sort((a, b) => {
            if (a[sortBy] > b[sortBy]) {
              return order === Order.DESC ? -1 : 1;
            }

            if (a[sortBy] < b[sortBy]) {
              return order === Order.ASC ? -1 : 1;
            }

            return 0;
          });
        }

        const indexContents = await fse.readFile(
          item.indexTemplate.path,
          'utf-8'
        );

        const pageData = frontmatter<PageMeta>(indexContents);

        const indexPage = await renderInLayout(
          item.indexTemplate.path,
          join(layoutsPath, 'layout.html.ejs'),
          {
            data: {
              files,
              ...meta,
              ...pageData.attributes,
            },
          }
        );

        await fse.outputFile(
          join(outPath, item.indexTemplate.permalink, INDEX),
          indexPage
        );
      }

      return done;
    })
  ).then(
    dests => ([] as File[]).concat(...dests) // Flatten
  );
}

// Kick her off:
async function main() {
  const collections: CollectionItem[] = [
    {
      directoryName: '_pages',
      template: 'page',
    },
    {
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
    },
  ];

  const hrstart = process.hrtime();

  await clean();
  await copyPublicDir();
  await buildSass({
    sassLocation: 'stylesheets', // Relative to sourcePath
    cssDestination: 'assets/css', // Relative to outputPath
  });

  const fileDestinations = await buildCollections(collections);

  const hrend = process.hrtime(hrstart);

  if (verbose) {
    fileDestinations.forEach(fileDestination =>
      notify(`${chalk.white('Wrote')} ${fileDestination}`)
    );
  }

  notify(`Done!`, chalk.green);
  notify(`In ${hrend[1] / 1_000_000}ms`, chalk.gray);
}

process.on('unhandledRejection', (err, promise) => {
  console.error('⚠️ Oh no, something was rejected!');
  console.error(chalk.red(err.stack || err));
  process.exit(1);
});

main().catch(err => {
  console.error('❌ Oops, something went wrong while building:');
  console.error(chalk.red(err.stack || err));
  process.exit(1);
});
