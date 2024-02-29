"use strict";
/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const utils = require("../utils");
const logger_1 = __importDefault(require("../logger"));
const util_1 = require("util");
const fs = require('fs');
const glob = (0, util_1.promisify)(require('glob'));
const copyFile = (0, util_1.promisify)(fs.copyFile);
const access = (0, util_1.promisify)(fs.access);
const exists = (path) => access(path).then(() => true).catch(() => false);
const restoreOverwrittenFilesWithOriginals = async () => {
    await copyFile(path.resolve('data/static/legal.md'), path.resolve('ftp/legal.md'));
    if (await exists(path.resolve('frontend/dist'))) {
        await copyFile(path.resolve('data/static/owasp_promo.vtt'), path.resolve('frontend/dist/frontend/assets/public/videos/owasp_promo.vtt'));
    }
    try {
        const files = await glob(path.resolve('data/static/i18n/*.json'));
        await Promise.all(files.map((filename) => copyFile(filename, path.resolve('i18n/', filename.substring(filename.lastIndexOf('/') + 1)))));
    }
    catch (err) {
        logger_1.default.warn('Error listing JSON files in /data/static/i18n folder: ' + utils.getErrorMessage(err));
    }
};
module.exports = restoreOverwrittenFilesWithOriginals;
//# sourceMappingURL=restoreOverwrittenFilesWithOriginals.js.map