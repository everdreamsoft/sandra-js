import { Sandra } from "../Sandra";
import { ILogger } from "../interfaces/ILogger";

export class Logger implements ILogger {

    private dataModificationQueries = ["insert", "update", "delete"];

    query(query: any, values?: any, exectime?: number): void {
        if (Sandra.LOG_CONFIG?.enable) {
            let lowerCasedQuery = (typeof query == "string") ? query.toLocaleLowerCase() : JSON.stringify(query).toLocaleLowerCase();
            if (this.dataModificationQueries.some(v => lowerCasedQuery.includes(v))) {
                console.warn(lowerCasedQuery + "; Values: [" + values?.toString() + "]; Time: " + (exectime || ""));
            }
            else
                console.info(lowerCasedQuery + "; Values: [" + values?.toString() + "]; Time: " + (exectime || ""));
        }
    }

    info(message: string) {
        if (Sandra.LOG_CONFIG?.enable)
            console.info(message);
    }

    warn(message: string) {
        if (Sandra.LOG_CONFIG?.enable)
            console.warn(message);
    }

    error(message: string) {
        if (Sandra.LOG_CONFIG?.enable)
            console.error(message);
    }

}