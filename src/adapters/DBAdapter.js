"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBAdapter = void 0;
const DBPool_1 = require("../connections/DBPool");
class DBAdapter {
    constructor(config) {
        this.pool = new DBPool_1.DBPool(config);
    }
    getConnectionPool() {
        return this.pool;
    }
    end() {
        return this.pool.end();
    }
}
exports.DBAdapter = DBAdapter;
//# sourceMappingURL=DBAdapter.js.map