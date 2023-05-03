export interface ILogger {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    query(query: any, values?: any, exectime?: number): void
}