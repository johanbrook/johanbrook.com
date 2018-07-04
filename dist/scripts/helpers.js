"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const glob_1 = __importDefault(require("glob"));
const config_1 = require("../config");
const chalk_1 = __importDefault(require("chalk"));
const { sourcePath } = config_1.buildConfig;
exports.findFiles = (pattern) => util_1.promisify(glob_1.default)(pattern, { cwd: sourcePath });
exports.notify = (msg, colorFn = chalk_1.default.gray) => console.log(colorFn(`· ${msg}`));
//# sourceMappingURL=helpers.js.map