"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importStar(require("path"));
const util_1 = require("util");
const config_1 = require("../../config");
const node_sass_1 = __importDefault(require("node-sass"));
const helpers_1 = require("../helpers");
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const { outPath, sourcePath } = config_1.buildConfig;
const renderSass = util_1.promisify(node_sass_1.default.render);
const sassOptions = {
    includePaths: [path_1.default.resolve('./node_modules/tachyons/src')],
    outputStyle: 'compressed',
};
function buildSass({ sassLocation, cssDestination, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const sassFiles = yield helpers_1.findFiles(path_1.join(sassLocation, '!(_)*.scss'));
        helpers_1.notify(`${chalk_1.default.white('Rendering')} Sass (${sassFiles.join(', ')})…`);
        try {
            for (const file of sassFiles) {
                const result = yield renderSass(Object.assign({}, sassOptions, { file: path_1.join(sourcePath, file) }));
                yield fs_extra_1.default.outputFile(path_1.join(outPath, cssDestination, `${path_1.default.parse(file).name}.css`), result.css);
            }
        }
        catch (ex) {
            const err = ex;
            const error = new Error(ex.formatted);
            error.name = err.name;
            error.stack = err.stack;
            throw error;
        }
    });
}
exports.default = buildSass;
//# sourceMappingURL=sass.js.map