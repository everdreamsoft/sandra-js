import { Sandra } from "../Sandra";
import { ILogger } from "../interfaces/ILogger";

export class Logger implements ILogger {

    logQuery(query: any): void {
        if (Sandra.LOG_CONFIG?.main) {
            if (typeof query == "string") {
                console.info(query);
            }
            else {
                console.log(JSON.stringify(query));
            }
        }
    }

    info(message: string) {
        if (Sandra.LOG_CONFIG?.main)
            console.info(message);
    }

    warn(message: string) {
        if (Sandra.LOG_CONFIG?.main)
            console.warn(message);
    }

    error(message: string) {
        if (Sandra.LOG_CONFIG?.main)
            console.error(message);
    }

}