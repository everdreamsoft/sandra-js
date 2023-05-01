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
        this.config = config;
        this.pool = promise_1.default.createPool({
            user: this.config.user,
            password: this.config.password,
            host: this.config.host,
            database: this.config.database,
            waitForConnections: this.config.waitForConnections ? this.config.waitForConnections : true,
            connectionLimit: this.config.connectionLimit ? this.config.connectionLimit : 10,
            queueLimit: this.config.queueLimit ? this.config.queueLimit : 0,
            acquireTimeout: this.config.acquireTimeout ? this.config.acquireTimeout : 0 // 0 as permanent connection,
        });
    }
    async end() {
        var _a;
        return (_a = this.pool) === null || _a === void 0 ? void 0 : _a.end();
    }
    abort(connection, reason) {
        console.log("Connection destroy.." + reason || "");
        connection.destroy();
    }
    getConnetion() {
        return this.pool.getConnection();
    }
    /**
    * Runs give query
    * @param sql Sql query
    * @param values query parameters
    * @returns
    */
    async query(sql, values, queryTimeout, abortSignal) {
        var _a, _b, _c, _d, _e;
        let start, result;
        let timeout = queryTimeout ? queryTimeout : 1000000;
        if ((_a = Sandra_1.Sandra.LOG_CONFIG) === null || _a === void 0 ? void 0 : _a.query) {
            LogManager_1.LogManager.getInstance().logQuery(sql);
            // if (values instanceof Array) {
            //     LogManager.getInstance().logQuery(values.toString());
            // }
            // else LogManager.getInstance().logQuery(values);
        }
        if (((_b = Sandra_1.Sandra.LOG_CONFIG) === null || _b === void 0 ? void 0 : _b.query) && ((_c = Sandra_1.Sandra.LOG_CONFIG) === null || _c === void 0 ? void 0 : _c.queryTime))
            start = perf_hooks_1.performance.now();
        let connection = await this.getConnetion();
        abortSignal === null || abortSignal === void 0 ? void 0 : abortSignal.on("abort", (() => {
            this.abort(connection, "abort called..");
        }).bind(this));
        try {
            result = await connection.query({ sql, timeout }, values);
            if (((_d = Sandra_1.Sandra.LOG_CONFIG) === null || _d === void 0 ? void 0 : _d.query) && ((_e = Sandra_1.Sandra.LOG_CONFIG) === null || _e === void 0 ? void 0 : _e.queryTime)) {
                LogManager_1.LogManager.getInstance().logQuery(`Time: ${(perf_hooks_1.performance.now() - start)} milliseconds`);
            }
        }
        catch (e) {
            LogManager_1.LogManager.getInstance().error(e);
        }
        finally {
            connection.release(); // Release the connection back to the pool
        }
        abortSignal === null || abortSignal === void 0 ? void 0 : abortSignal.removeAllListeners();
        return result;
    }
}
exports.DBPool = DBPool;
//# sourceMappingURL=DBPool.js.map