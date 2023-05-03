"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBBaseAdapter = void 0;
const DBPool_1 = require("../connections/DBPool");
class DBBaseAdapter {
    constructor(config) {
        this.pool = new DBPool_1.DBPool(config);
    }
    getConnectionPool() { return this.pool; }
    end() {
        return this.pool.end();
    }
}
exports.DBBaseAdapter = DBBaseAdapter;
//# sourceMappingURL=DBBaseAdapter.js.map