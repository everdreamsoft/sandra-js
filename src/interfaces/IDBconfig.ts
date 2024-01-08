import { IGraphTables } from "./IGraphTables";

export interface IDBConfig {
    name: string,
    host: string,
    user: string,
    password: string,
    database: string,
    env: string,
    waitForConnections?: boolean,
    connectionLimit?: number,
    queueLimit?: number,
    enableKeepAlive?: boolean,
    tables?: IGraphTables // Will ignore env if tables is set
}