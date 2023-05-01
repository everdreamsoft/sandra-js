"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBConnection = void 0;
const mariaDb = __importStar(require("mariadb"));
const LogManager_1 = require("./loggers/LogManager");
const Sandra_1 = require("./Sandra");
const perf_hooks_1 = require("perf_hooks");
class DBConnection {
    constructor() {
    }
    /**
     * Creates maridb connection instance
     */
    async connect(config) {
        try {
            let connSetting = Object.assign({}, config);
            delete connSetting.password;
            LogManager_1.LogManager.getInstance().info("Creating DB connection as " + JSON.stringify(connSetting));
            this.connection = await mariaDb.createConnection(config);
        }
        catch (e) {
            LogManager_1.LogManager.getInstance().error(e);
            throw e;
        }
    }
    async destroy() {
        try {
            if (this.connection) {
                LogManager_1.LogManager.getInstance().info("Closing connection");
                this.connection.destroy();
            }
        }
        catch (e) {
            LogManager_1.LogManager.getInstance().error(e);
            throw e;
        }
    }
    /**
     * Closes the DB connection
     */
    async close() {
        try {
            if (this.connection) {
                LogManager_1.LogManager.getInstance().info("Closing connection");
                await this.connection.end();
            }
        }
        catch (e) {
            LogManager_1.LogManager.getInstance().error(e);
            throw e;
        }
    }
    /**
     * Runs give query
     * @param sql Sql query
     * @param values query parameters
     * @returns
     */
    async query(sql, values) {
        var _a, _b, _c, _d, _e;
        let start;
        if ((_a = Sandra_1.Sandra.LOG_CONFIG) === null || _a === void 0 ? void 0 : _a.query) {
            LogManager_1.LogManager.getInstance().logQuery(sql);
            // if (values instanceof Array) {
            //     LogManager.getInstance().logQuery(values.toString());
            // }
            // else LogManager.getInstance().logQuery(values);
        }
        if (this.connection) {
            if (((_b = Sandra_1.Sandra.LOG_CONFIG) === null || _b === void 0 ? void 0 : _b.query) && ((_c = Sandra_1.Sandra.LOG_CONFIG) === null || _c === void 0 ? void 0 : _c.queryTime))
                start = perf_hooks_1.performance.now();
            let res = await this.connection.query(sql, values);
            if (((_d = Sandra_1.Sandra.LOG_CONFIG) === null || _d === void 0 ? void 0 : _d.query) && ((_e = Sandra_1.Sandra.LOG_CONFIG) === null || _e === void 0 ? void 0 : _e.queryTime)) {
                LogManager_1.LogManager.getInstance().logQuery(`Time: ${(perf_hooks_1.performance.now() - start)} milliseconds`);
            }
            return res;
        }
        throw (new Error("DB not connected"));
    }
    /**
     * Runs as a batch command
     * @param sql Sql query
     * @param values query parameter
     * @returns
     */
    async batch(sql, values) {
        var _a, _b, _c, _d, _e;
        let start;
        if ((_a = Sandra_1.Sandra.LOG_CONFIG) === null || _a === void 0 ? void 0 : _a.query) {
            LogManager_1.LogManager.getInstance().logQuery(sql);
        }
        if (this.connection) {
            if (((_b = Sandra_1.Sandra.LOG_CONFIG) === null || _b === void 0 ? void 0 : _b.query) && ((_c = Sandra_1.Sandra.LOG_CONFIG) === null || _c === void 0 ? void 0 : _c.queryTime))
                start = perf_hooks_1.performance.now();
            let res = await this.connection.batch(sql, values);
            if (((_d = Sandra_1.Sandra.LOG_CONFIG) === null || _d === void 0 ? void 0 : _d.query) && ((_e = Sandra_1.Sandra.LOG_CONFIG) === null || _e === void 0 ? void 0 : _e.queryTime)) {
                LogManager_1.LogManager.getInstance().logQuery(`Time: ${(perf_hooks_1.performance.now() - start)} milliseconds`);
            }
            return res;
        }
        throw (new Error("DB not connected"));
    }
}
exports.DBConnection = DBConnection;
//# sourceMappingURL=DBConnection.js.map