"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBPool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const perf_hooks_1 = require("perf_hooks");
const Sandra_1 = require("../Sandra");
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
    getConnetion() {
        return this.pool.getConnection();
    }
    getConfig() {
        let conf = Object.assign({}, this.config);
        delete conf.password;
        delete conf.user;
        return conf;
    }
    async end() {
        var _a, _b;
        LogManager_1.LogManager.getInstance().warn("ending pool" + JSON.stringify((_a = this.pool) === null || _a === void 0 ? void 0 : _a.getConfig()));
        return (_b = this.pool) === null || _b === void 0 ? void 0 : _b.end();
    }
    async query(sql, values, abortOption) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        let start, time;
        let result, timeout = (abortOption === null || abortOption === void 0 ? void 0 : abortOption.timeout) ? abortOption === null || abortOption === void 0 ? void 0 : abortOption.timeout : 10000;
        let connection = await this.getConnetion();
        (_a = abortOption === null || abortOption === void 0 ? void 0 : abortOption.abortSignal) === null || _a === void 0 ? void 0 : _a.on("abort", ((reason) => {
            LogManager_1.LogManager.getInstance().warn("connection destroy.." + reason || "");
            abortOption.abort = true;
            connection.destroy();
        }).bind(this));
        try {
            if (((_c = (_b = Sandra_1.Sandra.LOG_CONFIG) === null || _b === void 0 ? void 0 : _b.query) === null || _c === void 0 ? void 0 : _c.enable) && ((_e = (_d = Sandra_1.Sandra.LOG_CONFIG) === null || _d === void 0 ? void 0 : _d.query) === null || _e === void 0 ? void 0 : _e.time))
                start = perf_hooks_1.performance.now();
            result = connection.query({ sql, timeout }, values);
            if ((_g = (_f = Sandra_1.Sandra.LOG_CONFIG) === null || _f === void 0 ? void 0 : _f.query) === null || _g === void 0 ? void 0 : _g.enable) {
                let params = undefined;
                if ((_j = (_h = Sandra_1.Sandra.LOG_CONFIG) === null || _h === void 0 ? void 0 : _h.query) === null || _j === void 0 ? void 0 : _j.time)
                    time = perf_hooks_1.performance.now() - start;
                if ((_l = (_k = Sandra_1.Sandra.LOG_CONFIG) === null || _k === void 0 ? void 0 : _k.query) === null || _l === void 0 ? void 0 : _l.values)
                    params = values;
                LogManager_1.LogManager.getInstance().query(sql, params, time);
            }
        }
        catch (e) {
            LogManager_1.LogManager.getInstance().error(e);
        }
        finally {
            // Release the connection back to the pool
            connection.release();
        }
        // Removing listeners
        (_m = abortOption === null || abortOption === void 0 ? void 0 : abortOption.abortSignal) === null || _m === void 0 ? void 0 : _m.removeAllListeners();
        return result;
    }
}
exports.DBPool = DBPool;
//# sourceMappingURL=DBPool.js.map