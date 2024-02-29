"use strict";
/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchesEtcPasswdFile = exports.matchesSystemIniFile = exports.getErrorMessage = exports.thaw = exports.toSimpleIpAddress = exports.parseJsonCustom = exports.determineDisabledEnv = exports.disableOnWindowsEnv = exports.disableOnContainerEnv = exports.randomHexString = exports.jwtFrom = exports.downloadToFile = exports.extractFilename = exports.toISO8601 = exports.toMMMYY = exports.ctfFlag = exports.version = exports.trunc = exports.unquote = exports.containsOrEscaped = exports.containsEscaped = exports.contains = exports.endsWith = exports.startsWith = exports.isUrl = exports.queryResultToJson = void 0;
/* jslint node: true */
const package_json_1 = __importDefault(require("../package.json"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("./logger"));
const config_1 = __importDefault(require("config"));
const jssha_1 = __importDefault(require("jssha"));
const download_1 = __importDefault(require("download"));
const crypto_1 = __importDefault(require("crypto"));
const clarinet_1 = __importDefault(require("clarinet"));
const is_docker_1 = __importDefault(require("./is-docker"));
const is_windows_1 = __importDefault(require("./is-windows"));
const is_heroku_1 = __importDefault(require("./is-heroku"));
// import isGitpod from 'is-gitpod') // FIXME Roll back to this when https://github.com/dword-design/is-gitpod/issues/94 is resolve
const isGitpod = () => false;
const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const queryResultToJson = (data, status = 'success') => {
    let wrappedData = {};
    if (data) {
        if (!data.length && data.dataValues) {
            wrappedData = data.dataValues;
        }
        else if (data.length > 0) {
            wrappedData = [];
            for (let i = 0; i < data.length; i++) {
                wrappedData.push(data[i]?.dataValues ? data[i].dataValues : data[i]);
            }
        }
        else {
            wrappedData = data;
        }
    }
    return {
        status,
        data: wrappedData
    };
};
exports.queryResultToJson = queryResultToJson;
const isUrl = (url) => {
    return (0, exports.startsWith)(url, 'http');
};
exports.isUrl = isUrl;
const startsWith = (str, prefix) => str ? str.indexOf(prefix) === 0 : false;
exports.startsWith = startsWith;
const endsWith = (str, suffix) => (str && suffix) ? str.includes(suffix, str.length - suffix.length) : false;
exports.endsWith = endsWith;
const contains = (str, element) => str ? str.includes(element) : false; // TODO Inline all usages as this function is not adding any functionality to String.includes
exports.contains = contains;
const containsEscaped = function (str, element) {
    return (0, exports.contains)(str, element.replace(/"/g, '\\"'));
};
exports.containsEscaped = containsEscaped;
const containsOrEscaped = function (str, element) {
    return (0, exports.contains)(str, element) || (0, exports.containsEscaped)(str, element);
};
exports.containsOrEscaped = containsOrEscaped;
const unquote = function (str) {
    if (str && (0, exports.startsWith)(str, '"') && (0, exports.endsWith)(str, '"')) {
        return str.substring(1, str.length - 1);
    }
    else {
        return str;
    }
};
exports.unquote = unquote;
const trunc = function (str, length) {
    str = str.replace(/(\r\n|\n|\r)/gm, '');
    return (str.length > length) ? str.substr(0, length - 1) + '...' : str;
};
exports.trunc = trunc;
const version = (module) => {
    if (module) {
        // @ts-expect-error FIXME Ignoring any type issue on purpose
        return package_json_1.default.dependencies[module];
    }
    else {
        return package_json_1.default.version;
    }
};
exports.version = version;
let cachedCtfKey;
const getCtfKey = () => {
    if (!cachedCtfKey) {
        if (process.env.CTF_KEY !== undefined && process.env.CTF_KEY !== '') {
            cachedCtfKey = process.env.CTF_KEY;
        }
        else {
            const data = fs_1.default.readFileSync('ctf.key', 'utf8');
            cachedCtfKey = data;
        }
    }
    return cachedCtfKey;
};
const ctfFlag = (text) => {
    const shaObj = new jssha_1.default('SHA-1', 'TEXT'); // eslint-disable-line new-cap
    shaObj.setHMACKey(getCtfKey(), 'TEXT');
    shaObj.update(text);
    return shaObj.getHMAC('HEX');
};
exports.ctfFlag = ctfFlag;
const toMMMYY = (date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    return months[month] + year.toString().substring(2, 4);
};
exports.toMMMYY = toMMMYY;
const toISO8601 = (date) => {
    let day = '' + date.getDate();
    let month = '' + (date.getMonth() + 1);
    const year = date.getFullYear();
    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;
    return [year, month, day].join('-');
};
exports.toISO8601 = toISO8601;
const extractFilename = (url) => {
    let file = decodeURIComponent(url.substring(url.lastIndexOf('/') + 1));
    if ((0, exports.contains)(file, '?')) {
        file = file.substring(0, file.indexOf('?'));
    }
    return file;
};
exports.extractFilename = extractFilename;
const downloadToFile = async (url, dest) => {
    try {
        const data = await (0, download_1.default)(url);
        fs_1.default.writeFileSync(dest, data);
    }
    catch (err) {
        logger_1.default.warn('Failed to download ' + url + ' (' + (0, exports.getErrorMessage)(err) + ')');
    }
};
exports.downloadToFile = downloadToFile;
const jwtFrom = ({ headers }) => {
    if (headers?.authorization) {
        const parts = headers.authorization.split(' ');
        if (parts.length === 2) {
            const scheme = parts[0];
            const token = parts[1];
            if (/^Bearer$/i.test(scheme)) {
                return token;
            }
        }
    }
    return undefined;
};
exports.jwtFrom = jwtFrom;
const randomHexString = (length) => {
    return crypto_1.default.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};
exports.randomHexString = randomHexString;
const disableOnContainerEnv = () => {
    return ((0, is_docker_1.default)() || isGitpod() || (0, is_heroku_1.default)()) && !config_1.default.get('challenges.safetyOverride');
};
exports.disableOnContainerEnv = disableOnContainerEnv;
const disableOnWindowsEnv = () => {
    return (0, is_windows_1.default)();
};
exports.disableOnWindowsEnv = disableOnWindowsEnv;
const determineDisabledEnv = (disabledEnv) => {
    if ((0, is_docker_1.default)()) {
        return disabledEnv && (disabledEnv === 'Docker' || disabledEnv.includes('Docker')) ? 'Docker' : null;
    }
    else if ((0, is_heroku_1.default)()) {
        return disabledEnv && (disabledEnv === 'Heroku' || disabledEnv.includes('Heroku')) ? 'Heroku' : null;
    }
    else if ((0, is_windows_1.default)()) {
        return disabledEnv && (disabledEnv === 'Windows' || disabledEnv.includes('Windows')) ? 'Windows' : null;
    }
    else if (isGitpod()) {
        return disabledEnv && (disabledEnv === 'Gitpod' || disabledEnv.includes('Gitpod')) ? 'Gitpod' : null;
    }
    return null;
};
exports.determineDisabledEnv = determineDisabledEnv;
const parseJsonCustom = (jsonString) => {
    const parser = clarinet_1.default.parser();
    const result = [];
    parser.onkey = parser.onopenobject = (k) => {
        result.push({ key: k, value: null });
    };
    parser.onvalue = (v) => {
        result[result.length - 1].value = v;
    };
    parser.write(jsonString);
    parser.close();
    return result;
};
exports.parseJsonCustom = parseJsonCustom;
const toSimpleIpAddress = (ipv6) => {
    if ((0, exports.startsWith)(ipv6, '::ffff:')) {
        return ipv6.substr(7);
    }
    else if (ipv6 === '::1') {
        return '127.0.0.1';
    }
    else {
        return ipv6;
    }
};
exports.toSimpleIpAddress = toSimpleIpAddress;
const thaw = (frozenObject) => {
    return JSON.parse(JSON.stringify(frozenObject));
};
exports.thaw = thaw;
const getErrorMessage = (error) => {
    if (error instanceof Error)
        return error.message;
    return String(error);
};
exports.getErrorMessage = getErrorMessage;
const matchesSystemIniFile = (text) => {
    const match = text.match(/; for 16-bit app support/gi);
    return match !== null && match.length >= 1;
};
exports.matchesSystemIniFile = matchesSystemIniFile;
const matchesEtcPasswdFile = (text) => {
    const match = text.match(/(\w*:\w*:\d*:\d*:\w*:.*)|(Note that this file is consulted directly)/gi);
    return match !== null && match.length >= 1;
};
exports.matchesEtcPasswdFile = matchesEtcPasswdFile;
//# sourceMappingURL=utils.js.map