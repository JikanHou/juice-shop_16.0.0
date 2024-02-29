"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("../models/user");
const utils = __importStar(require("../lib/utils"));
const security = require('../lib/insecurity');
module.exports = function retrieveUserList() {
    return (_req, res, next) => {
        user_1.UserModel.findAll().then((users) => {
            const usersWithLoginStatus = utils.queryResultToJson(users);
            usersWithLoginStatus.data.forEach((user) => {
                user.token = security.authenticatedUsers.tokenOf(user);
                if (user.password) {
                    user.password = user.password.replace(/./g, '*');
                }
                if (user.totpSecret) {
                    user.totpSecret = user.totpSecret.replace(/./g, '*');
                }
            });
            res.json(usersWithLoginStatus);
        }).catch((error) => {
            next(error);
        });
    };
};
//# sourceMappingURL=authenticatedUsers.js.map