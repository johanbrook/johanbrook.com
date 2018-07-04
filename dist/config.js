"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importStar(require("path"));
const sourcePath = path_1.default.resolve('src');
const outPath = path_1.default.resolve('build');
const layoutsPath = path_1.join(sourcePath, 'layouts');
const templatesPath = path_1.join(sourcePath, 'templates');
exports.buildConfig = {
    sourcePath,
    outPath,
    publicDir: 'public',
    layoutsPath,
    templatesPath,
};
exports.meta = {
    description: "I'm a twenty-something designer and developer travelling the world. I work with the best people in a company called Lookback, where I help interfaces come to life.",
    shortbio: 'I’m coding & designering and I like working with product, user experience, and interface design and other things too. Like everybody else here.',
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
//# sourceMappingURL=config.js.map