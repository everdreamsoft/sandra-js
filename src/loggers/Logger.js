"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const Sandra_1 = require("../Sandra");
class Logger {
    constructor() {
        this.dataModificationQueries = ["insert", "update", "delete"];
    }
    query(query, values, exectime) {
        var _a;
        if (((_a = Sandra_1.Sandra.LOG_CONFIG) === null || _a === void 0 ? void 0 : _a.enable) && Sandra_1.Sandra.LOG_CONFIG.query) {
            let lowerCasedQuery = (typeof query == "string") ? query.toLocaleLowerCase() : JSON.stringify(query).toLocaleLowerCase();
            if (this.dataModificationQueries.some(v => lowerCasedQuery.includes(v))) {
                console.warn(lowerCasedQuery + "; Values: [" + (values === null || values === void 0 ? void 0 : values.toString()) + "]; Time: " + (exectime || ""));
            }
            else
                console.info(lowerCasedQuery + "; Values: [" + (values === null || values === void 0 ? void 0 : values.toString()) + "]; Time: " + (exectime || ""));
        }
        return Promise.resolve();
    }
    info(message) {
        var _a;
        if ((_a = Sandra_1.Sandra.LOG_CONFIG) === null || _a === void 0 ? void 0 : _a.enable)
            console.info(message);
        return Promise.resolve();
    }
    warn(message) {
        var _a;
        if ((_a = Sandra_1.Sandra.LOG_CONFIG) === null || _a === void 0 ? void 0 : _a.enable)
            console.warn(message);
        return Promise.resolve();
    }
    error(message) {
        var _a;
        if ((_a = Sandra_1.Sandra.LOG_CONFIG) === null || _a === void 0 ? void 0 : _a.enable)
            console.error(message);
        return Promise.resolve();
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map