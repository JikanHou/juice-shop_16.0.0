"use strict";
/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const safe_1 = __importDefault(require("colors/safe"));
const utils = require("../utils");
const logger_1 = __importDefault(require("../logger"));
try {
    require('check-dependencies');
}
catch (err) {
    console.error('Please run "npm install" before starting the application!');
    process.exit(1);
}
const dependencyChecker = require('check-dependencies');
const validateDependencies = async ({ packageDir = '.', exitOnFailure = true } = {}) => {
    let success = true;
    let dependencies = {};
    try {
        dependencies = await dependencyChecker({ packageDir, scopeList: ['dependencies'] });
    }
    catch (err) {
        logger_1.default.warn(`Dependencies in ${safe_1.default.bold(packageDir + '/package.json')} could not be checked due to "${utils.getErrorMessage(err)}" error (${safe_1.default.red('NOT OK')})`);
    }
    if (dependencies.depsWereOk === true) {
        logger_1.default.info(`All dependencies in ${safe_1.default.bold(packageDir + '/package.json')} are satisfied (${safe_1.default.green('OK')})`);
    }
    else {
        logger_1.default.warn(`Dependencies in ${safe_1.default.bold(packageDir + '/package.json')} are not rightly satisfied (${safe_1.default.red('NOT OK')})`);
        success = false;
        for (const err of dependencies.error) {
            logger_1.default.warn(err);
        }
    }
    if (!success && exitOnFailure) {
        logger_1.default.error(safe_1.default.red('Exiting due to unsatisfied dependencies!'));
        process.exit(1);
    }
};
module.exports = validateDependencies;
//# sourceMappingURL=validateDependencies.js.map