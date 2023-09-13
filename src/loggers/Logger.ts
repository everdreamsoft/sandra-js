import { Sandra } from "../Sandra";
import { ILogger } from "../interfaces/ILogger";

export class Logger implements ILogger {

    private dataModificationQueries = ["insert", "update", "delete"];

    query(query: any, values?: any, exectime?: number) {
        if (Sandra.LOG_CONFIG?.enable && Sandra.LOG_CONFIG.query) {
            let lowerCasedQuery = (typeof query == "string") ? query.toLocaleLowerCase() : JSON.stringify(query).toLocaleLowerCase();
            if (this.dataModificationQueries.some(v => lowerCasedQuery.includes(v))) {
                console.warn(lowerCasedQuery + "; Values: [" + values?.toString() + "]; Time: " + (exectime || ""));
            }
            else
                console.info(lowerCasedQuery + "; Values: [" + values?.toString() + "]; Time: " + (exectime || ""));
        }
        return Promise.resolve();
    }

    info(message: string) {
        if (Sandra.LOG_CONFIG?.enable)
            console.info(message);
        return Promise.resolve();
    }

    warn(message: string) {
        if (Sandra.LOG_CONFIG?.enable)
            console.warn(message);
        return Promise.resolve();
    }

    error(message: string) {
        if (Sandra.LOG_CONFIG?.enable)
            console.error(message);
        return Promise.resolve();
    }

}