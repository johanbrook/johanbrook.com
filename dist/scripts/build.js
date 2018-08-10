"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const fs_extra_1 = __importDefault(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importStar(require("path"));
const front_matter_1 = __importDefault(require("front-matter"));
const marked_1 = __importDefault(require("marked"));
const ejs_1 = __importDefault(require("ejs"));
const slug_1 = __importDefault(require("slug"));
const helpers_1 = require("./helpers");
const sass_1 = __importDefault(require("./plugins/sass"));
const verbose = process.argv[2] === '--verbose';
const INDEX = 'index.html';
/* TODO

  - [x] Custom templates & layouts
  - [x] Permalinks
  - [x] Posts index page
  - [x] Ordering
  - [ ] Pagination
  - [ ] Drafts
  - [ ] Sass rendering/minification
  - [ ] EJS helpers
*/
const { sourcePath, outPath, publicDir, layoutsPath, templatesPath, } = config_1.buildConfig;
var Order;
(function (Order) {
    Order[Order["ASC"] = 0] = "ASC";
    Order[Order["DESC"] = 1] = "DESC";
})(Order || (Order = {}));
helpers_1.notify(`Reading from\t${chalk_1.default.magenta(sourcePath)}`);
helpers_1.notify(`Writing to\t${chalk_1.default.magenta(outPath)}`);
helpers_1.notify("Let's go!\n", chalk_1.default.bold);
function clean() {
    return __awaiter(this, void 0, void 0, function* () {
        helpers_1.notify(`${chalk_1.default.white('Cleaning')} ${outPath} dir…`);
        yield fs_extra_1.default.emptyDir(outPath);
    });
}
function copyPublicDir() {
    helpers_1.notify(`${chalk_1.default.white('Copying')} ${publicDir} dir…`);
    fs_extra_1.default.copy(path_1.join(sourcePath, publicDir), outPath);
}
function buildPermalinkDestination(fileData, collectionItem, pageData) {
    // Skip subdir if name is something like index.md
    // Becomes `subdir` as URL.
    if (fileData.name === 'index') {
        return {
            path: path_1.join(outPath, INDEX),
            url: '/',
        };
    }
    // Build permalink according to pattern in the CollectionItem.
    // Becomes like: `some-slug/index.html`:
    if (collectionItem.permalink) {
        const urlPath = collectionItem.permalink.replace(/:([\w-]+)/g, (_, pageProp) => {
            if (pageData[pageProp]) {
                return slug_1.default(pageData[pageProp]);
            }
            throw Error(`${pageProp} doesn't exist on item! ${JSON.stringify({
                fileData,
                collectionItem,
            }, null, 4)}`);
        });
        return {
            url: urlPath,
            path: path_1.join(outPath, urlPath, INDEX),
        };
    }
    // Transform `something.md` to `something/index.html`.
    // URL becomes `/something`
    return {
        url: `/${slug_1.default(fileData.name)}`,
        path: path_1.join(outPath, fileData.name, INDEX),
    };
}
function render(layoutPath, props = {}) {
    return fs_extra_1.default
        .readFile(layoutPath, 'utf-8')
        .then(contents => {
        const pageData = front_matter_1.default(contents);
        return ejs_1.default.render(pageData.body, Object.assign({}, props.data, pageData.attributes, { body: props.body }), { async: true });
    })
        .catch(err => {
        console.error(chalk_1.default.red(`Error when rendering ${layoutPath}:`));
        console.error(chalk_1.default.red(err.stack || err));
        return `<h1>Rendering Error</h1><pre>${err.stack || err}</pre>`;
    });
}
function renderInLayout(templatePath, layoutPath, props = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const templatedBody = yield render(templatePath, props);
        return yield render(layoutPath, {
            body: templatedBody,
            data: props.data,
        });
    });
}
function buildFile(filePath, collectionItem) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileData = path_1.default.parse(filePath);
        const fileContents = yield fs_extra_1.default.readFile(path_1.join(sourcePath, filePath), 'utf-8');
        const pageData = front_matter_1.default(fileContents);
        const templateData = Object.assign({}, fileData, config_1.meta, pageData.attributes);
        const { title = fileData.name, date = new Date(), slug: theSlug, category, link, tags, } = pageData.attributes;
        const slug = theSlug || slug_1.default(title);
        pageData.attributes.slug = slug;
        const body = (() => {
            switch (fileData.ext) {
                case '.md':
                    return marked_1.default(pageData.body);
                case '.ejs':
                    return ejs_1.default.render(pageData.body, templateData);
                default:
                    return pageData.body;
            }
        })();
        const completePage = yield renderInLayout(path_1.join(templatesPath, `${templateData.template || collectionItem.template}.html.ejs`), path_1.join(layoutsPath, `${templateData.layout || 'layout'}.html.ejs`), { body, data: templateData });
        const { path: fileDestination, url } = buildPermalinkDestination(fileData, collectionItem, pageData.attributes);
        yield fs_extra_1.default.outputFile(fileDestination, completePage);
        const file = {
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
    });
}
function buildCollections(collections) {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.all(collections.map((item) => __awaiter(this, void 0, void 0, function* () {
            const collectionFiles = yield helpers_1.findFiles(path_1.join(item.directoryName, '*.@(md|ejs|html|json)'));
            helpers_1.notify(`${chalk_1.default.white('Building')} ${collectionFiles.length} files in ${item.directoryName}…`);
            const done = Promise.all(collectionFiles.map(file => buildFile(file, item)));
            if (item.indexTemplate) {
                const files = yield done;
                if (item.indexTemplate.ordering) {
                    const { sortBy, order } = item.indexTemplate.ordering;
                    helpers_1.notify(`${chalk_1.default.white('Sorting')} ${item.directoryName} by ${sortBy}, ${order} order…`);
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
                const indexPage = yield renderInLayout(item.indexTemplate.path, path_1.join(layoutsPath, 'layout.html.ejs'), {
                    data: Object.assign({ files }, config_1.meta),
                });
                yield fs_extra_1.default.outputFile(path_1.join(outPath, item.indexTemplate.permalink, INDEX), indexPage);
            }
            return done;
        }))).then(dests => [].concat(...dests) // Flatten
        );
    });
}
// Kick her off:
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const collections = [
            {
                directoryName: '_pages',
                template: 'page',
            },
            {
                directoryName: '_posts',
                template: 'post',
                permalink: '/writings/:slug',
                indexTemplate: {
                    path: path_1.join(templatesPath, 'posts.html.ejs'),
                    permalink: '/writings',
                    ordering: {
                        sortBy: 'date',
                        order: Order.DESC,
                    },
                },
            },
        ];
        const hrstart = process.hrtime();
        yield clean();
        yield copyPublicDir();
        yield sass_1.default({
            sassLocation: 'stylesheets',
            cssDestination: 'assets/css',
        });
        const fileDestinations = yield buildCollections(collections);
        const hrend = process.hrtime(hrstart);
        if (verbose) {
            fileDestinations.forEach(fileDestination => helpers_1.notify(`${chalk_1.default.white('Wrote')} ${fileDestination}`));
        }
        helpers_1.notify(`Done!`, chalk_1.default.green);
        helpers_1.notify(`In ${hrend[1] / 1000000}ms`, chalk_1.default.gray);
    });
}
process.on('unhandledRejection', (err, promise) => {
    console.error('⚠️ Oh no, something was rejected!');
    console.error(chalk_1.default.red(err.stack || err));
    process.exit(1);
});
main().catch(err => {
    console.error('❌ Oops, something went wrong while building:');
    console.error(chalk_1.default.red(err.stack || err));
    process.exit(1);
});
//# sourceMappingURL=build.js.map