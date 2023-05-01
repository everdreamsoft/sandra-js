"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const Sandra_1 = require("../Sandra");
class Logger {
    constructor() {
        this.dataModificationQueries = ["insert", "update", "delete"];
    }
    logQuery(query) {
        var _a;
        if ((_a = Sandra_1.Sandra.LOG_CONFIG) === null || _a === void 0 ? void 0 : _a.main) {
            let lowerCasedQuery = (typeof query == "string") ? query.toLocaleLowerCase() : JSON.stringify(query).toLocaleLowerCase();
            if (this.dataModificationQueries.some(v => lowerCasedQuery.includes(v))) {
                console.warn(lowerCasedQuery);
            }
            else
                console.info(lowerCasedQuery);
        }
    }
    info(message) {
        var _a;
        if ((_a = Sandra_1.Sandra.LOG_CONFIG) === null || _a === void 0 ? void 0 : _a.main)
            console.info(message);
    }
    warn(message) {
        var _a;
        if ((_a = Sandra_1.Sandra.LOG_CONFIG) === null || _a === void 0 ? void 0 : _a.main)
            console.warn(message);
    }
    error(message) {
        var _a;
        if ((_a = Sandra_1.Sandra.LOG_CONFIG) === null || _a === void 0 ? void 0 : _a.main)
            console.error(message);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map