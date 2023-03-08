import { DBAdapter } from "./DBAdapter";
import { IAppConfig } from "./interfaces/IAPPConfig";
import { IDBConfig } from "./interfaces/IDBconfig";

export class Sandra {
    public static DB_CONFIG: IDBConfig;
    public static APP_CONFIG: IAppConfig;

    static async closeConncetion() {
        return (await DBAdapter.getInstance()).close();
    }

}