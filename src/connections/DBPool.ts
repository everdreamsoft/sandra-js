import mysql from "mysql2/promise";
import PoolConnection from "mysql2/typings/mysql/lib/PoolConnection";
import { performance } from "perf_hooks";
import { Sandra } from "../Sandra";
import { IAbortOption } from "../interfaces/IAbortOption";
import { IDBConfig } from "../interfaces/IDBconfig";
import { LogManager } from "../loggers/LogManager";


export class DBPool {

    private config: IDBConfig;
    private pool: any;

    constructor(config: IDBConfig) {
        this.config = config;
        this.pool = mysql.createPool({
            user: this.config.user,
            password: this.config.password,
            host: this.config.host,
            database: this.config.database,
            waitForConnections: this.config.waitForConnections ? this.config.waitForConnections : true,
            connectionLimit: this.config.connectionLimit ? this.config.connectionLimit : 10,
            queueLimit: this.config.queueLimit ? this.config.queueLimit : 0,
            enableKeepAlive: this.config?.enableKeepAlive ? this.config?.enableKeepAlive : false
        });
    }

    private getConnetion(): Promise<PoolConnection> {
        return this.pool.getConnection();
    }

    async end(): Promise<void> {
        return this.pool?.end();
    }

    async query(sql: string, values?: any | any[] | { [param: string]: any }, abortOption?: IAbortOption): Promise<[any, any]> {

        let start: any | undefined, time: any | undefined;
        let result: any, timeout = abortOption?.timeout ? abortOption?.timeout : 10000;

        let connection = await this.getConnetion();

        abortOption?.abortSignal?.on("abort", ((reason?: string) => {
            console.log("connection destroy.." + reason || "");
            abortOption.abort = true;
            connection.destroy();
        }).bind(this));

        try {

            if (Sandra.LOG_CONFIG?.query?.enable && Sandra.LOG_CONFIG?.query?.time) start = performance.now();

            result = connection.query({ sql, timeout }, values);

            if (Sandra.LOG_CONFIG?.query?.enable) {
                let params = undefined;
                if (Sandra.LOG_CONFIG?.query?.time) time = performance.now() - start;
                if (Sandra.LOG_CONFIG?.query?.values) params = values;
                LogManager.getInstance().query(sql, params, time);
            }

        } catch (e: any) {
            LogManager.getInstance().error(e);
        } finally {
            // Release the connection back to the pool
            connection.release();
        }

        // Removing listeners
        abortOption?.abortSignal?.removeAllListeners();

        return result;

    }

}
