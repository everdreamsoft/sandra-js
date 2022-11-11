"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const LogManager_1 = require("./LogManager");
class Logger {
    info(message) {
        if (LogManager_1.LogManager.log)
            console.info(message);
    }
    warn(message) {
        if (LogManager_1.LogManager.log)
            console.warn(message);
    }
    error(message) {
        if (LogManager_1.LogManager.log)
            console.error(message);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map