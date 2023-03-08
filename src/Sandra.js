"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sandra = void 0;
const DBAdapter_1 = require("./DBAdapter");
class Sandra {
    static async closeConncetion() {
        return (await DBAdapter_1.DBAdapter.getInstance()).close();
    }
}
exports.Sandra = Sandra;
//# sourceMappingURL=Sandra.js.map