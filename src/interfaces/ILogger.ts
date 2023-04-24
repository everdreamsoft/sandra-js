export interface ILogger {
    info(message: string): void;
    warn(message: string): void;
    error(e: any): void;
}