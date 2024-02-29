"use strict";
/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
const server = require("./../server");
module.exports = async () => {
    // eslint-disable-next-line no-async-promise-executor
    await new Promise(async (resolve, reject) => {
        await server.start((err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
};
//# sourceMappingURL=apiTestsSetup.js.map