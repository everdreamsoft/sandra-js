"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB = void 0;
const Sandra_1 = require("../Sandra");
const SandraAdapter_1 = require("../adapters/SandraAdapter");
const LogManager_1 = require("../loggers/LogManager");
class DB {
    constructor() {
        this.dbInstances = new Map();
    }
    static getInstance() {
        if (!DB.instance) {
            DB.instance = new DB();
        }
        return DB.instance;
    }
    /**
     * Creates maridb connection instance
     */
    add(config, dbAdapter) {
        try {
            let adapter;
            if (this.dbInstances.has(config.name)) {
                adapter = this.dbInstances.get(config.name);
            }
            if (adapter)
                return (adapter);
            if (dbAdapter)
                adapter = dbAdapter;
            else
                adapter = new SandraAdapter_1.SandraAdapter(config);
            this.dbInstances.set(config.name, adapter);
            return (adapter);
        }
        catch (e) {
            LogManager_1.LogManager.getInstance().error(e);
            throw e;
        }
    }
    /**
     * Closes the DB connection
     */
    async remove(name) {
        var _a;
        try {
            if (this.dbInstances.has(name)) {
                LogManager_1.LogManager.getInstance().info("closing connection " + name);
                (_a = this.dbInstances.get(name)) === null || _a === void 0 ? void 0 : _a.end();
                this.dbInstances.delete(name);
            }
        }
        catch (e) {
            LogManager_1.LogManager.getInstance().error(e);
            throw e;
        }
    }
    server(name = "sandra") {
        var _a, _b;
        if (this.dbInstances.has(name)) {
            return (_a = this.dbInstances) === null || _a === void 0 ? void 0 : _a.get(name);
        }
        if (Array.isArray(Sandra_1.Sandra.DB_CONFIG)) {
            LogManager_1.LogManager.getInstance().info("multiple conf for DB found, adding new with name " + name);
            let confIndex = Sandra_1.Sandra.DB_CONFIG.findIndex(c => c.name == name);
            if (confIndex >= 0)
                return this.add(Sandra_1.Sandra.DB_CONFIG[confIndex]);
            throw new Error("DB configuration not found for given name " + name);
        }
        LogManager_1.LogManager.getInstance().info("adding config with name " + name);
        if (((_b = Sandra_1.Sandra.DB_CONFIG.name) === null || _b === void 0 ? void 0 : _b.trim().length) == 0) {
            LogManager_1.LogManager.getInstance().info("conf name not set, taking as default: " + name);
            Sandra_1.Sandra.DB_CONFIG.name = name;
        }
        return this.add(Sandra_1.Sandra.DB_CONFIG);
    }
}
exports.DB = DB;
//# sourceMappingURL=DB.js.map