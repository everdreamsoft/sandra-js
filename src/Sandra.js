"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sandra = void 0;
const DB_1 = require("./connections/DB");
class Sandra {
    static async close(server = "sandra") {
        var _a, _b, _c;
        if ((_a = DB_1.DB.getInstance()) === null || _a === void 0 ? void 0 : _a.server(server)) {
            return (_c = (_b = DB_1.DB.getInstance()) === null || _b === void 0 ? void 0 : _b.server(server)) === null || _c === void 0 ? void 0 : _c.end();
        }
        return Promise.resolve(0);
    }
    static getDBConfig(server = "sandra") {
        var _a, _b, _c;
        return (_c = (_b = (_a = DB_1.DB.getInstance()) === null || _a === void 0 ? void 0 : _a.server(server)) === null || _b === void 0 ? void 0 : _b.getConnectionPool()) === null || _c === void 0 ? void 0 : _c.getConfig();
    }
}
exports.Sandra = Sandra;
//# sourceMappingURL=Sandra.js.map