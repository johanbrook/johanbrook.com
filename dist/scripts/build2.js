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
const fs_extra_1 = __importDefault(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("../config");
const xstream_1 = __importDefault(require("xstream"));
const front_matter_1 = __importDefault(require("front-matter"));
const path_1 = __importStar(require("path"));
const helpers_1 = require("./helpers");
const slug_1 = __importDefault(require("slug"));
const { sourcePath, outPath, publicDir, layoutsPath, templatesPath, } = config_1.buildConfig;
var Order;
(function (Order) {
    Order[Order["ASC"] = 0] = "ASC";
    Order[Order["DESC"] = 1] = "DESC";
})(Order || (Order = {}));
const page$ = {
    directoryName: '_pages',
    template: 'page',
};
const post$ = {
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
};
function collectAttributes(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileData = path_1.default.parse(filePath);
        const fileContents = yield fs_extra_1.default.readFile(path_1.join(sourcePath, filePath), 'utf-8');
        const pageData = front_matter_1.default(fileContents);
        const { title = fileData.name, slug: theSlug } = pageData.attributes;
        const slug = theSlug || slug_1.default(title);
        return Object.assign({}, config_1.meta, pageData.attributes, { slug });
    });
}
function readFiles(pattern) {
    return (item$) => item$.map((item) => __awaiter(this, void 0, void 0, function* () {
        const promise = yield helpers_1.findFiles(path_1.join(item.directoryName, pattern));
        const files = yield promise;
        return files.map(f => collectAttributes(f));
    }));
}
function main(startStream$) {
    return __awaiter(this, void 0, void 0, function* () {
        return startStream$.compose(readFiles('*.@(md|ejs|html|json)'));
    });
}
process.on('unhandledRejection', (err, promise) => {
    console.error('⚠️ Oh no, something was rejected!');
    console.error(chalk_1.default.red(err.stack || err));
    process.exit(1);
});
main(xstream_1.default.merge(xstream_1.default.of(page$), xstream_1.default.of(post$))).catch(err => {
    console.error('❌ Oops, something went wrong while building:');
    console.error(chalk_1.default.red(err.stack || err));
    process.exit(1);
});
//# sourceMappingURL=build2.js.map