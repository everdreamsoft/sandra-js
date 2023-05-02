import * as mariaDb from "mariadb";
import { IDBConfig } from "./interfaces/IDBconfig";
import { LogManager } from "./loggers/LogManager";
import { QueryOptions } from "mariadb";
import { Sandra } from "./Sandra";
import { performance } from "perf_hooks"

export class DBConnection {

    private connection: mariaDb.Connection | undefined;

    constructor() {
    }

    /**
     * Creates maridb connection instance 
     */
    async connect(config: IDBConfig) {
        try {
            let connSetting: any = { ...config };
            delete connSetting.password;
            LogManager.getInstance().info("Creating DB connection as " + JSON.stringify(connSetting));
            this.connection = await mariaDb.createConnection(config);
        } catch (e) {
            LogManager.getInstance().error(e);
            throw e;
        }
    }

    async destroy() {
        try {
            if (this.connection) {
                LogManager.getInstance().info("Closing connection");
                this.connection.destroy();
            }
        } catch (e) {
            LogManager.getInstance().error(e);
            throw e;
        }
    }

    /**
     * Closes the DB connection
     */
    async close() {
        try {
            if (this.connection) {
                LogManager.getInstance().info("Closing connection");
                await this.connection.end();
            }
        } catch (e) {
            LogManager.getInstance().error(e);
            throw e;
        }
    }

    /**
     * Runs give query
     * @param sql Sql query
     * @param values query parameters
     * @returns 
     */
    async query(sql: string | QueryOptions, values?: any): Promise<any> {

        let start: any | undefined, end: any | undefined, time: any | undefined;

        if (this.connection) {

            if (Sandra.LOG_CONFIG?.query?.enable && Sandra.LOG_CONFIG?.query?.time) start = performance.now();

            let res = await this.connection.query(sql, values);

            if (Sandra.LOG_CONFIG?.query?.enable) {
                let params = undefined;
                if (Sandra.LOG_CONFIG?.query?.time) time = performance.now() - start;
                if (Sandra.LOG_CONFIG?.query?.values) params = values;
                LogManager.getInstance().query(sql, params, time);
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
    async batch(sql: string | QueryOptions, values?: any): Promise<any> {

        let start: any | undefined, end: any | undefined, time: any | undefined;

        if (this.connection) {
            if (Sandra.LOG_CONFIG?.query?.enable && Sandra.LOG_CONFIG?.query?.time) start = performance.now();

            let res = await this.connection.batch(sql, values);

            if (Sandra.LOG_CONFIG?.query?.enable) {
                let params = undefined;
                if (Sandra.LOG_CONFIG?.query?.time) time = performance.now() - start;
                if (Sandra.LOG_CONFIG?.query?.values) params = values;
                LogManager.getInstance().query(sql, params, time);
            }

            return res;

        }

        throw (new Error("DB not connected"));

    }

}
