import { Sandra } from "../Sandra";
import { ILogger } from "../interfaces/ILogger";

export class Logger implements ILogger {

    private dataModificationQueries = ["insert", "update", "delete"];

    logQuery(query: any): void {
        if (Sandra.LOG_CONFIG?.main) {
            let lowerCasedQuery = (typeof query == "string") ? query.toLocaleLowerCase() : JSON.stringify(query).toLocaleLowerCase();
            if (this.dataModificationQueries.some(v => lowerCasedQuery.includes(v))) {
                console.warn(lowerCasedQuery)
            }
            else console.info(lowerCasedQuery);
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