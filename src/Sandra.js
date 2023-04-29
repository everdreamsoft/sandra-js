"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sandra = void 0;
const DB_1 = require("./connections/DB");
class Sandra {
    static async close(server = "sandra") {
        var _a, _b, _c;
        if ((_a = DB_1.DB.getInstance()) === null || _a === void 0 ? void 0 : _a.server()) {
            return (_c = (_b = DB_1.DB.getInstance()) === null || _b === void 0 ? void 0 : _b.server(server)) === null || _c === void 0 ? void 0 : _c.end();
        }
        console.log("closing sandra connection / instance not found");
        return Promise.resolve(0);
    }
    static getDBConfig() {
        let conf = Object.assign({}, Sandra.DB_CONFIG);
        delete conf.password;
        delete conf.user;
        return conf;
    }
}
exports.Sandra = Sandra;
//# sourceMappingURL=Sandra.js.map