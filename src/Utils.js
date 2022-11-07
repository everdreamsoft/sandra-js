"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
const Reference_1 = require("./Reference");
const SystemConcepts_1 = require("./SystemConcepts");
class Utils {
    static getDBConfig() {
        return {
            user: "lindt_ranjit",
            database: "lindt_helvetia",
            env: "fondue",
            host: "mysql-lindt.alwaysdata.net",
            password: "",
            multipleStatements: true
        };
    }
    static isNullConcept(concept) {
        return concept.getId() === -999;
    }
    static async createDBReference(shortname, value, tripletLink = null) {
        return new Reference_1.Reference(-1, await SystemConcepts_1.SystemConcepts.get(shortname), tripletLink, value);
    }
}
exports.Utils = Utils;
//# sourceMappingURL=Utils.js.map