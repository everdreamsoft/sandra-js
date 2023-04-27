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

        let start: any | undefined;

        if (Sandra.LOG_CONFIG?.query) {
            LogManager.getInstance().logQuery(sql);
            // if (values instanceof Array) {
            //     LogManager.getInstance().logQuery(values.toString());
            // }
            // else LogManager.getInstance().logQuery(values);
        }

        if (this.connection) {

            if (Sandra.LOG_CONFIG?.query && Sandra.LOG_CONFIG?.queryTime) start = performance.now();

            let res = await this.connection.query(sql, values);

            if (Sandra.LOG_CONFIG?.query && Sandra.LOG_CONFIG?.queryTime) {
                LogManager.getInstance().logQuery(`Time: ${(performance.now() - start)} milliseconds`);
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

        let start: any | undefined;

        if (Sandra.LOG_CONFIG?.query) {
            LogManager.getInstance().logQuery(sql);
        }

        if (this.connection) {
            if (Sandra.LOG_CONFIG?.query && Sandra.LOG_CONFIG?.queryTime) start = performance.now();

            let res = await this.connection.batch(sql, values);

            if (Sandra.LOG_CONFIG?.query && Sandra.LOG_CONFIG?.queryTime) {
                LogManager.getInstance().logQuery(`Time: ${(performance.now() - start)} milliseconds`);
            }

            return res;

        }

        throw (new Error("DB not connected"));

    }

}
