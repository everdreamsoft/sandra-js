"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
const Reference_1 = require("./Reference");
const SystemConcepts_1 = require("./SystemConcepts");
const TemporaryId_1 = require("./TemporaryId");
const crypto_1 = __importDefault(require("crypto"));
class Utils {
    static async createDBReference(shortname, value, tripletLink = null) {
        return new Reference_1.Reference(TemporaryId_1.TemporaryId.create(), await SystemConcepts_1.SystemConcepts.get(shortname), tripletLink, value);
    }
    static getHash(value) {
        return crypto_1.default.createHash('md5').update(value).digest("hex");
    }
    static wait(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }
}
exports.Utils = Utils;
//# sourceMappingURL=Utils.js.map