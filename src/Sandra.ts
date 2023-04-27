import { DBAdapter } from "./DBAdapter";
import { IAppConfig } from "./interfaces/IAppConfig";
import { IDBConfig } from "./interfaces/IDBconfig";
import { ILogConfig } from "./interfaces/ILogConfig";

export class Sandra {

    public static DB_CONFIG: IDBConfig;
    public static APP_CONFIG: IAppConfig;
    public static LOG_CONFIG: ILogConfig;

    static async closeConncetion() {
        if (DBAdapter.getInstanceObject()) {
            console.log("closing sandra connection ")
            return (await DBAdapter.getInstance()).close();
        }
        console.log("closing sandra connection / instance not found");
        return Promise.resolve(0);
    }

    static getDBConfig(): any {
        let conf: any = { ...Sandra.DB_CONFIG };
        delete conf.password;
        delete conf.user;
        return conf;
    }

}