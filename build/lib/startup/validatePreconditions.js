"use strict";
/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const package_json_1 = __importDefault(require("../../package.json"));
const config_1 = __importDefault(require("config"));
const logger_1 = __importDefault(require("../logger"));
const path_1 = __importDefault(require("path"));
const safe_1 = __importDefault(require("colors/safe"));
const util_1 = require("util");
const process = require('process');
const semver = require('semver');
const portscanner = require('portscanner');
const fs = require('fs');
const checkInternetConnected = require('check-internet-connected');
const access = (0, util_1.promisify)(fs.access);
const domainDependencies = {
    'https://www.alchemy.com/': ['"Mint the Honeypot" challenge', '"Wallet Depletion" challenge']
};
const validatePreconditions = async ({ exitOnFailure = true } = {}) => {
    let success = true;
    success = checkIfRunningOnSupportedNodeVersion(process.version) && success;
    success = checkIfRunningOnSupportedOS(process.platform) && success;
    success = checkIfRunningOnSupportedCPU(process.arch) && success;
    const asyncConditions = (await Promise.all([
        checkIfRequiredFileExists('build/server.js'),
        checkIfRequiredFileExists('frontend/dist/frontend/index.html'),
        checkIfRequiredFileExists('frontend/dist/frontend/styles.css'),
        checkIfRequiredFileExists('frontend/dist/frontend/main.js'),
        checkIfRequiredFileExists('frontend/dist/frontend/polyfills.js'),
        checkIfRequiredFileExists('frontend/dist/frontend/runtime.js'),
        checkIfRequiredFileExists('frontend/dist/frontend/vendor.js'),
        checkIfPortIsAvailable(process.env.PORT || config_1.default.get('server.port')),
        checkIfDomainReachable('https://www.alchemy.com/')
    ])).every(condition => condition);
    if ((!success || !asyncConditions) && exitOnFailure) {
        logger_1.default.error(safe_1.default.red('Exiting due to unsatisfied precondition!'));
        process.exit(1);
    }
    return success;
};
const checkIfRunningOnSupportedNodeVersion = (runningVersion) => {
    const supportedVersion = package_json_1.default.engines.node;
    const effectiveVersionRange = semver.validRange(supportedVersion);
    if (!semver.satisfies(runningVersion, effectiveVersionRange)) {
        logger_1.default.warn(`Detected Node version ${safe_1.default.bold(runningVersion)} is not in the supported version range of ${supportedVersion} (${safe_1.default.red('NOT OK')})`);
        return false;
    }
    logger_1.default.info(`Detected Node.js version ${safe_1.default.bold(runningVersion)} (${safe_1.default.green('OK')})`);
    return true;
};
const checkIfRunningOnSupportedOS = (runningOS) => {
    const supportedOS = package_json_1.default.os;
    if (!supportedOS.includes(runningOS)) {
        logger_1.default.warn(`Detected OS ${safe_1.default.bold(runningOS)} is not in the list of supported platforms ${supportedOS} (${safe_1.default.red('NOT OK')})`);
        return false;
    }
    logger_1.default.info(`Detected OS ${safe_1.default.bold(runningOS)} (${safe_1.default.green('OK')})`);
    return true;
};
const checkIfRunningOnSupportedCPU = (runningArch) => {
    const supportedArch = package_json_1.default.cpu;
    if (!supportedArch.includes(runningArch)) {
        logger_1.default.warn(`Detected CPU ${safe_1.default.bold(runningArch)} is not in the list of supported architectures ${supportedArch} (${safe_1.default.red('NOT OK')})`);
        return false;
    }
    logger_1.default.info(`Detected CPU ${safe_1.default.bold(runningArch)} (${safe_1.default.green('OK')})`);
    return true;
};
const checkIfDomainReachable = async (domain) => {
    return checkInternetConnected({ domain })
        .then(() => {
        logger_1.default.info(`Domain ${safe_1.default.bold(domain)} is reachable (${safe_1.default.green('OK')})`);
        return true;
    })
        .catch(() => {
        logger_1.default.warn(`Domain ${safe_1.default.bold(domain)} is not reachable (${safe_1.default.yellow('NOT OK')} in a future major release)`);
        // @ts-expect-error FIXME Type problem by accessing key via variable
        domainDependencies[domain].forEach((dependency) => {
            logger_1.default.warn(`${safe_1.default.italic(dependency)} will not work as intended without access to ${safe_1.default.bold(domain)}`);
        });
        return true; // TODO Consider switching to "false" with breaking release v16.0.0 or later
    });
};
const checkIfPortIsAvailable = async (port) => {
    return await new Promise((resolve, reject) => {
        portscanner.checkPortStatus(port, function (error, status) {
            if (error) {
                reject(error);
            }
            else {
                if (status === 'open') {
                    logger_1.default.warn(`Port ${safe_1.default.bold(port.toString())} is in use (${safe_1.default.red('NOT OK')})`);
                    resolve(false);
                }
                else {
                    logger_1.default.info(`Port ${safe_1.default.bold(port.toString())} is available (${safe_1.default.green('OK')})`);
                    resolve(true);
                }
            }
        });
    });
};
const checkIfRequiredFileExists = async (pathRelativeToProjectRoot) => {
    const fileName = pathRelativeToProjectRoot.substr(pathRelativeToProjectRoot.lastIndexOf('/') + 1);
    return access(path_1.default.resolve(pathRelativeToProjectRoot)).then(() => {
        logger_1.default.info(`Required file ${safe_1.default.bold(fileName)} is present (${safe_1.default.green('OK')})`);
        return true;
    }).catch(() => {
        logger_1.default.warn(`Required file ${safe_1.default.bold(fileName)} is missing (${safe_1.default.red('NOT OK')})`);
        return false;
    });
};
validatePreconditions.checkIfRunningOnSupportedNodeVersion = checkIfRunningOnSupportedNodeVersion;
validatePreconditions.checkIfPortIsAvailable = checkIfPortIsAvailable;
validatePreconditions.checkIfRequiredFileExists = checkIfRequiredFileExists;
module.exports = validatePreconditions;
//# sourceMappingURL=validatePreconditions.js.map