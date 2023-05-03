import { DB } from "./connections/DB";
import { IAppConfig } from "./interfaces/IAppConfig";
import { IDBConfig } from "./interfaces/IDBconfig";
import { ILogConfig } from "./interfaces/ILogConfig";

export class Sandra {

    public static DB_CONFIG: IDBConfig | IDBConfig[];
    public static APP_CONFIG: IAppConfig;
    public static LOG_CONFIG: ILogConfig;

    static async close(server: string = "sandra") {
        if (DB.getInstance()?.server()) {
            return DB.getInstance()?.server(server)?.end();
        }
        return Promise.resolve(0);
    }

    static getDBConfig(server: string = "sandra"): any {
        return DB.getInstance()?.server(server)?.getConnectionPool()?.getConfig()
    }

}