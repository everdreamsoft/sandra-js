"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogManager = void 0;
const Logger_1 = require("./Logger");
class LogManager {
    static getInstance() {
        if (!LogManager.instance) {
            LogManager.instance = new Logger_1.Logger();
        }
        return LogManager.instance;
    }
    static setLogger(logger) {
        LogManager.instance = logger;
    }
}
exports.LogManager = LogManager;
LogManager.log = true;
//# sourceMappingURL=LogManager.js.map