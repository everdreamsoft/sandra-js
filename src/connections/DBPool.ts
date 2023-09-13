import mysql, { Pool, PoolConnection } from "mysql2/promise";
import { IAbortOption } from "../interfaces/IAbortOption";
import { IDBConfig } from "../interfaces/IDBconfig";
import { LogManager } from "../loggers/LogManager";


export class DBPool {

    private config: IDBConfig;
    private pool: Pool;

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

    private createPool() {
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

    private async getConnetion(): Promise<PoolConnection> {
        let c = await this.pool.getConnection().catch(e => {
            this.createPool();
            return this.pool.getConnection();
        });
        return c;
    }

    getConfig() {

        let c: any = this.pool.pool.config
        let conf: any = {
            name: this.config?.name,
            user: c?.connectionConfig.user,
            host: c?.connectionConfig.host,
            database: c?.connectionConfig.database,
            env: this.config?.env,
            enableKeepAlive: c?.connectionConfig.enableKeepAlive,
            connectionLimit: c?.connectionLimit
        };
        return conf;
    }

    async end(): Promise<void> {
        LogManager.getInstance().warn("ending pool" + JSON.stringify(this.getConfig()));
        return this.pool?.end();
    }

    async query(sql: string, values?: any | any[] | { [param: string]: any }, abortOption?: IAbortOption): Promise<[any, any]> {

        let start: any | undefined;
        let result: any, timeout = abortOption?.timeout ? abortOption?.timeout : 1000000;

        let connection = await this.getConnetion();

        this.pool.query

        abortOption?.abortSignal?.on("abort", ((reason?: string) => {
            LogManager.getInstance().warn("connection destroy.." + reason || "");
            abortOption.abort = true;
            connection.destroy();
        }).bind(this));

        try {

            start = Date.now();

            result = connection.query({ sql, timeout }, values);

            await LogManager.getInstance().query(sql, values, (Date.now() - start));


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
