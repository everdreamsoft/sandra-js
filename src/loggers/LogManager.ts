import { ILogger } from "../interfaces/ILogger";
import { Logger } from "./Logger";

export class LogManager {

    private static instance: ILogger;

    public static getInstance(): ILogger {
        if (!LogManager.instance) {
            LogManager.instance = new Logger();
        }
        return LogManager.instance;
    }

    public static setLogger(logger: ILogger) {
        LogManager.instance = logger;
    }


}