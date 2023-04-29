export interface IDBConfig {
    name:string,
    host: string,
    user: string,
    password: string,
    database: string,
    env: string,
    waitForConnections?: boolean,
    connectionLimit?: number,
    queueLimit?: number,
    acquireTimeout?: number
}