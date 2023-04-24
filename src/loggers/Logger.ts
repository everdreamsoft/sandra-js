import { ILogger } from "../interfaces/ILogger";
import { LogManager } from "./LogManager";

export class Logger implements ILogger {

    info(message: string) {
        if (LogManager.log)
            console.info(message);
    }

    warn(message: string) {
        if (LogManager.log)
            console.warn(message);
    }

    error(error: any) {
        if (LogManager.log) {
            console.error(error.code);
            console.error(error.message);
            //console.error(error.stack);
        }
    }

}