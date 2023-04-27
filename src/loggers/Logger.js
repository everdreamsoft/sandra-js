"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const Sandra_1 = require("../Sandra");
class Logger {
    logQuery(query) {
        var _a;
        if ((_a = Sandra_1.Sandra.LOG_CONFIG) === null || _a === void 0 ? void 0 : _a.main) {
            if (typeof query == "string") {
                console.info(query);
            }
            else {
                console.log(JSON.stringify(query));
            }
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