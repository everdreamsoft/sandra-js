"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sandra = void 0;
const DBAdapter_1 = require("./DBAdapter");
class Sandra {
    static async closeConncetion() {
        if (DBAdapter_1.DBAdapter.getInstanceObject()) {
            console.log("closing sandra connection ");
            return (await DBAdapter_1.DBAdapter.getInstance()).close();
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