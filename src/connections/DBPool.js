"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBPool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const perf_hooks_1 = require("perf_hooks");
const LogManager_1 = require("../loggers/LogManager");
class DBPool {
    constructor(config) {
        var _a, _b;
        this.config = config;
        this.pool = promise_1.default.createPool({
            user: this.config.user,
            password: this.config.password,
            host: this.config.host,
            database: this.config.database,
            waitForConnections: this.config.waitForConnections ? this.config.waitForConnections : true,
            connectionLimit: this.config.connectionLimit ? this.config.connectionLimit : 10,
            queueLimit: this.config.queueLimit ? this.config.queueLimit : 0,
            enableKeepAlive: ((_a = this.config) === null || _a === void 0 ? void 0 : _a.enableKeepAlive) ? (_b = this.config) === null || _b === void 0 ? void 0 : _b.enableKeepAlive : false
        });
    }
    createPool() {
        var _a, _b;
        this.pool = promise_1.default.createPool({
            user: this.config.user,
            password: this.config.password,
            host: this.config.host,
            database: this.config.database,
            waitForConnections: this.config.waitForConnections ? this.config.waitForConnections : true,
            connectionLimit: this.config.connectionLimit ? this.config.connectionLimit : 10,
            queueLimit: this.config.queueLimit ? this.config.queueLimit : 0,
            enableKeepAlive: ((_a = this.config) === null || _a === void 0 ? void 0 : _a.enableKeepAlive) ? (_b = this.config) === null || _b === void 0 ? void 0 : _b.enableKeepAlive : false
        });
    }
    async getConnetion() {
        let c = await this.pool.getConnection().catch(e => {
            this.createPool();
            return this.pool.getConnection();
        });
        return c;
    }
    getConfig() {
        var _a;
        let c = this.pool.pool.config;
        let conf = {
            name: (_a = this.config) === null || _a === void 0 ? void 0 : _a.name,
            user: c === null || c === void 0 ? void 0 : c.connectionConfig.user,
            host: c === null || c === void 0 ? void 0 : c.connectionConfig.host,
            database: c === null || c === void 0 ? void 0 : c.connectionConfig.database,
            enableKeepAlive: c === null || c === void 0 ? void 0 : c.connectionConfig.enableKeepAlive,
            connectionLimit: c === null || c === void 0 ? void 0 : c.connectionLimit
        };
        return conf;
    }
    async end() {
        var _a;
        LogManager_1.LogManager.getInstance().warn("ending pool" + JSON.stringify(this.getConfig()));
        return (_a = this.pool) === null || _a === void 0 ? void 0 : _a.end();
    }
    async query(sql, values, abortOption) {
        var _a, _b;
        let start;
        let result, timeout = (abortOption === null || abortOption === void 0 ? void 0 : abortOption.timeout) ? abortOption === null || abortOption === void 0 ? void 0 : abortOption.timeout : 1000000;
        let connection = await this.getConnetion();
        this.pool.query;
        (_a = abortOption === null || abortOption === void 0 ? void 0 : abortOption.abortSignal) === null || _a === void 0 ? void 0 : _a.on("abort", ((reason) => {
            LogManager_1.LogManager.getInstance().warn("connection destroy.." + reason || "");
            abortOption.abort = true;
            connection.destroy();
        }).bind(this));
        try {
            start = perf_hooks_1.performance.now();
            result = connection.query({ sql, timeout }, values);
            LogManager_1.LogManager.getInstance().query(sql, values, (perf_hooks_1.performance.now() - start));
        }
        catch (e) {
            LogManager_1.LogManager.getInstance().error(e);
        }
        finally {
            // Release the connection back to the pool
            connection.release();
        }
        // Removing listeners
        (_b = abortOption === null || abortOption === void 0 ? void 0 : abortOption.abortSignal) === null || _b === void 0 ? void 0 : _b.removeAllListeners();
        return result;
    }
}
exports.DBPool = DBPool;
//# sourceMappingURL=DBPool.js.map