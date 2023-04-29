import { isArray } from "util";
import { Sandra } from "../Sandra";
import { DBBaseAdapter } from "../adapters/DBBaseAdapter";
import { SandraAdapter } from "../adapters/SandraAdapter";
import { IDBConfig } from "../interfaces/IDBconfig";
import { LogManager } from "../loggers/LogManager";

export class DB {

    private static instance: DB;

    private dbInstances: Map<string, DBBaseAdapter>;

    private constructor() {
        this.dbInstances = new Map();
    }

    public static getInstance(): DB {
        if (!DB.instance) {
            DB.instance = new DB();
        }

        return DB.instance;
    }

    /**
     * Creates maridb connection instance 
     */
    add(config: IDBConfig, dbAdapter?: DBBaseAdapter): DBBaseAdapter {

        try {

            let adapter: DBBaseAdapter | undefined;

            if (this.dbInstances.has(config.name)) {
                adapter = this.dbInstances.get(config.name);
            }

            if (adapter)
                return (adapter);

            if (dbAdapter) adapter = dbAdapter; else adapter = new SandraAdapter(config);

            this.dbInstances.set(config.name, adapter);

            return (adapter);

        } catch (e: any) {
            LogManager.getInstance().error(e);
            throw e;
        }
    }

    /**
     * Closes the DB connection
     */
    async remove(name: string) {
        try {
            if (this.dbInstances.has(name)) {
                LogManager.getInstance().info("closing connection " + name);
                this.dbInstances.get(name)?.end();
                this.dbInstances.delete(name);
            }
        } catch (e: any) {
            LogManager.getInstance().error(e);
            throw e;
        }
    }

    server(name: string = "sandra") {

        if (this.dbInstances.has(name)) {
            return this.dbInstances?.get(name);
        }

        if (Array.isArray(Sandra.DB_CONFIG)) {

            LogManager.getInstance().info("multiple conf for DB found, adding new with name " + name);

            let confIndex = Sandra.DB_CONFIG.findIndex(c => c.name == name);

            if (confIndex >= 0)
                return this.add(Sandra.DB_CONFIG[confIndex]);

            throw new Error("DB configuration not found for given name " + name);
        }

        LogManager.getInstance().info("adding config with name " + name);

        if (Sandra.DB_CONFIG.name?.trim().length == 0) {
            LogManager.getInstance().info("conf name not set, taking as default: " + name);
            Sandra.DB_CONFIG.name = name;
        }

        return this.add(Sandra.DB_CONFIG);


    }

}
