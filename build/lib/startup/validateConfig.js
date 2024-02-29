"use strict";
/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const process = require("process");
const logger_1 = __importDefault(require("../logger"));
const config_1 = __importDefault(require("config"));
const path_1 = __importDefault(require("path"));
const safe_1 = __importDefault(require("colors/safe"));
const validateSchema = require('yaml-schema-validator/src');
const specialProducts = [
    { name: '"Christmas Special" challenge product', key: 'useForChristmasSpecialChallenge' },
    { name: '"Product Tampering" challenge product', key: 'urlForProductTamperingChallenge' },
    { name: '"Retrieve Blueprint" challenge product', key: 'fileForRetrieveBlueprintChallenge', extra: { key: 'exifForBlueprintChallenge', name: 'list of EXIF metadata properties' } },
    { name: '"Leaked Unsafe Product" challenge product', key: 'keywordsForPastebinDataLeakChallenge' }
];
const specialMemories = [
    { name: '"Meta Geo Stalking" challenge memory', user: 'john', keys: ['geoStalkingMetaSecurityQuestion', 'geoStalkingMetaSecurityAnswer'] },
    { name: '"Visual Geo Stalking" challenge memory', user: 'emma', keys: ['geoStalkingVisualSecurityQuestion', 'geoStalkingVisualSecurityAnswer'] }
];
const validateConfig = ({ products = config_1.default.get('products'), memories = config_1.default.get('memories'), exitOnFailure = true }) => {
    let success = true;
    success = checkYamlSchema() && success;
    success = checkMinimumRequiredNumberOfProducts(products) && success;
    success = checkUnambiguousMandatorySpecialProducts(products) && success;
    success = checkUniqueSpecialOnProducts(products) && success;
    success = checkNecessaryExtraKeysOnSpecialProducts(products) && success;
    success = checkMinimumRequiredNumberOfMemories(memories) && success;
    success = checkUnambiguousMandatorySpecialMemories(memories) && success;
    success = checkUniqueSpecialOnMemories(memories) && success;
    success = checkSpecialMemoriesHaveNoUserAssociated(memories) && success;
    success = checkForIllogicalCombos() && success;
    if (success) {
        logger_1.default.info(`Configuration ${safe_1.default.bold(process.env.NODE_ENV ?? 'default')} validated (${safe_1.default.green('OK')})`);
    }
    else {
        logger_1.default.warn(`Configuration ${safe_1.default.bold(process.env.NODE_ENV ?? 'default')} validated (${safe_1.default.red('NOT OK')})`);
        logger_1.default.warn(`Visit ${safe_1.default.yellow('https://pwning.owasp-juice.shop/part1/customization.html#yaml-configuration-file')} for the configuration schema definition.`);
        if (exitOnFailure) {
            logger_1.default.error(safe_1.default.red('Exiting due to configuration errors!'));
            process.exit(1);
        }
    }
    return success;
};
const checkYamlSchema = (configuration = config_1.default.util.toObject()) => {
    let success = true;
    const schemaErrors = validateSchema(configuration, { schemaPath: path_1.default.resolve('config.schema.yml'), logLevel: 'none' });
    if (schemaErrors.length !== 0) {
        logger_1.default.warn(`Config schema validation failed with ${schemaErrors.length} errors (${safe_1.default.red('NOT OK')})`);
        schemaErrors.forEach(({ path, message }) => {
            logger_1.default.warn(`${path}:${safe_1.default.red(message.substr(message.indexOf(path) + path.length))}`);
        });
        success = false;
    }
    return success;
};
const checkMinimumRequiredNumberOfProducts = (products) => {
    let success = true;
    if (products.length < 4) {
        logger_1.default.warn(`Only ${products.length} products are configured but at least four are required (${safe_1.default.red('NOT OK')})`);
        success = false;
    }
    return success;
};
const checkUnambiguousMandatorySpecialProducts = (products) => {
    let success = true;
    specialProducts.forEach(({ name, key }) => {
        // @ts-expect-error FIXME Ignoring any type issue on purpose
        const matchingProducts = products.filter((product) => product[key]);
        if (matchingProducts.length === 0) {
            logger_1.default.warn(`No product is configured as ${safe_1.default.italic(name)} but one is required (${safe_1.default.red('NOT OK')})`);
            success = false;
        }
        else if (matchingProducts.length > 1) {
            logger_1.default.warn(`${matchingProducts.length} products are configured as ${safe_1.default.italic(name)} but only one is allowed (${safe_1.default.red('NOT OK')})`);
            success = false;
        }
    });
    return success;
};
const checkNecessaryExtraKeysOnSpecialProducts = (products) => {
    let success = true;
    specialProducts.forEach(({ name, key, extra = {} }) => {
        // @ts-expect-error FIXME implicit any type issue
        const matchingProducts = products.filter((product) => product[key]);
        // @ts-expect-error FIXME implicit any type issue
        if (extra.key && matchingProducts.length === 1 && !matchingProducts[0][extra.key]) {
            logger_1.default.warn(`Product ${safe_1.default.italic(matchingProducts[0].name)} configured as ${safe_1.default.italic(name)} does't contain necessary ${safe_1.default.italic(`${extra.name}`)} (${safe_1.default.red('NOT OK')})`);
            success = false;
        }
    });
    return success;
};
const checkUniqueSpecialOnProducts = (products) => {
    let success = true;
    products.forEach((product) => {
        // @ts-expect-error FIXME any type issue
        const appliedSpecials = specialProducts.filter(({ key }) => product[key]);
        if (appliedSpecials.length > 1) {
            logger_1.default.warn(`Product ${safe_1.default.italic(product.name)} is used as ${appliedSpecials.map(({ name }) => `${safe_1.default.italic(name)}`).join(' and ')} but can only be used for one challenge (${safe_1.default.red('NOT OK')})`);
            success = false;
        }
    });
    return success;
};
const checkMinimumRequiredNumberOfMemories = (memories) => {
    let success = true;
    if (memories.length < 2) {
        logger_1.default.warn(`Only ${memories.length} memories are configured but at least two are required (${safe_1.default.red('NOT OK')})`);
        success = false;
    }
    return success;
};
const checkUnambiguousMandatorySpecialMemories = (memories) => {
    let success = true;
    specialMemories.forEach(({ name, keys }) => {
        // @ts-expect-error FIXME any type issue
        const matchingMemories = memories.filter((memory) => memory[keys[0]] && memory[keys[1]]);
        if (matchingMemories.length === 0) {
            logger_1.default.warn(`No memory is configured as ${safe_1.default.italic(name)} but one is required (${safe_1.default.red('NOT OK')})`);
            success = false;
        }
        else if (matchingMemories.length > 1) {
            logger_1.default.warn(`${matchingMemories.length} memories are configured as ${safe_1.default.italic(name)} but only one is allowed (${safe_1.default.red('NOT OK')})`);
            success = false;
        }
    });
    return success;
};
const checkSpecialMemoriesHaveNoUserAssociated = (memories) => {
    let success = true;
    specialMemories.forEach(({ name, user, keys }) => {
        // @ts-expect-error FIXME any type issue
        const matchingMemories = memories.filter((memory) => memory[keys[0]] && memory[keys[1]] && memory.user && memory.user !== user);
        if (matchingMemories.length > 0) {
            logger_1.default.warn(`Memory configured as ${safe_1.default.italic(name)} must belong to user ${safe_1.default.italic(user)} but was linked to ${safe_1.default.italic(matchingMemories[0].user)} user (${safe_1.default.red('NOT OK')})`);
            success = false;
        }
    });
    return success;
};
const checkUniqueSpecialOnMemories = (memories) => {
    let success = true;
    memories.forEach((memory) => {
        // @ts-expect-error FIXME any type issue
        const appliedSpecials = specialMemories.filter(({ keys }) => memory[keys[0]] && memory[keys[1]]);
        if (appliedSpecials.length > 1) {
            logger_1.default.warn(`Memory ${safe_1.default.italic(memory.caption)} is used as ${appliedSpecials.map(({ name }) => `${safe_1.default.italic(name)}`).join(' and ')} but can only be used for one challenge (${safe_1.default.red('NOT OK')})`);
            success = false;
        }
    });
    return success;
};
const checkForIllogicalCombos = (configuration = config_1.default.util.toObject()) => {
    let success = true;
    if (configuration.challenges.restrictToTutorialsFirst && !configuration.hackingInstructor.isEnabled) {
        logger_1.default.warn(`Restricted tutorial mode is enabled while Hacking Instructor is disabled (${safe_1.default.red('NOT OK')})`);
        success = false;
    }
    if (configuration.ctf.showFlagsInNotifications && !configuration.challenges.showSolvedNotifications) {
        logger_1.default.warn(`CTF flags are enabled while challenge solved notifications are disabled (${safe_1.default.red('NOT OK')})`);
        success = false;
    }
    if (['name', 'flag', 'both'].includes(configuration.ctf.showCountryDetailsInNotifications) && !configuration.ctf.showFlagsInNotifications) {
        logger_1.default.warn(`CTF country mappings for FBCTF are enabled while CTF flags are disabled (${safe_1.default.red('NOT OK')})`);
        success = false;
    }
    return success;
};
validateConfig.checkYamlSchema = checkYamlSchema;
validateConfig.checkUnambiguousMandatorySpecialProducts = checkUnambiguousMandatorySpecialProducts;
validateConfig.checkUniqueSpecialOnProducts = checkUniqueSpecialOnProducts;
validateConfig.checkNecessaryExtraKeysOnSpecialProducts = checkNecessaryExtraKeysOnSpecialProducts;
validateConfig.checkMinimumRequiredNumberOfProducts = checkMinimumRequiredNumberOfProducts;
validateConfig.checkUnambiguousMandatorySpecialMemories = checkUnambiguousMandatorySpecialMemories;
validateConfig.checkUniqueSpecialOnMemories = checkUniqueSpecialOnMemories;
validateConfig.checkMinimumRequiredNumberOfMemories = checkMinimumRequiredNumberOfMemories;
validateConfig.checkSpecialMemoriesHaveNoUserAssociated = checkSpecialMemoriesHaveNoUserAssociated;
module.exports = validateConfig;
//# sourceMappingURL=validateConfig.js.map