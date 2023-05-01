import { Connection } from "mysql2";
import mysql from "mysql2/promise";
import PoolConnection from "mysql2/typings/mysql/lib/PoolConnection";
import { performance } from "perf_hooks";
import { Sandra } from "../Sandra";
import { IDBConfig } from "../interfaces/IDBconfig";
import { LogManager } from "../loggers/LogManager";
import { EventEmitter } from "stream";


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
            acquireTimeout: this.config.acquireTimeout ? this.config.acquireTimeout : 0 // 0 as permanent connection,
        });

    }

    async end(): Promise<void> {
        return this.pool?.end();
    }

    abort(connection: PoolConnection, reason?: string): void {
        console.log("Connection destroy.." + reason || "");
        connection.destroy();
    }

    getConnetion(): Promise<PoolConnection> {
        return this.pool.getConnection();
    }

    /**
    * Runs give query
    * @param sql Sql query
    * @param values query parameters
    * @returns 
    */
    async query(sql: string, values?: any | any[] | { [param: string]: any }, queryTimeout?: number, abortSignal?: EventEmitter): Promise<[any, any]> {

        let start: any | undefined, result: any;
        let timeout = queryTimeout ? queryTimeout : 1000000;

        if (Sandra.LOG_CONFIG?.query) {
            LogManager.getInstance().logQuery(sql);
            // if (values instanceof Array) {
            //     LogManager.getInstance().logQuery(values.toString());
            // }
            // else LogManager.getInstance().logQuery(values);
        }

        if (Sandra.LOG_CONFIG?.query && Sandra.LOG_CONFIG?.queryTime) start = performance.now();

        let connection = await this.getConnetion();

        abortSignal?.on("abort", (() => {
            this.abort(connection, "abort called..");
        }).bind(this));

        try {

            result = await connection.query({ sql, timeout }, values);

            if (Sandra.LOG_CONFIG?.query && Sandra.LOG_CONFIG?.queryTime) {
                LogManager.getInstance().logQuery(`Time: ${(performance.now() - start)} milliseconds`);
            }

        } catch (e: any) {
            LogManager.getInstance().error(e);
        } finally {
            connection.release(); // Release the connection back to the pool
        }

        abortSignal?.removeAllListeners();

        return result;

    }


}
