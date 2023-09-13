export interface ILogger {
    info(message: any): Promise<void>;
    warn(message: any): Promise<void>;
    error(message: any): Promise<void>;
    query(query: any, values?: any, exectime?: number): Promise<void>
}