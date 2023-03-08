import { DBAdapter } from "./DBAdapter";
import { IAppConfig } from "./interfaces/IAPPConfig";
import { IDBConfig } from "./interfaces/IDBconfig";

export class Sandra {
    public static DB_CONFIG: IDBConfig;
    public static APP_CONFIG: IAppConfig;

    static async closeConncetion() {
        if (DBAdapter.getInstanceObject()) {
            console.log("closing sandra connection ")
            return (await DBAdapter.getInstance()).close();
        }
        console.log("closing sandra connection / instance not found");
        return Promise.resolve(0);
    }

}