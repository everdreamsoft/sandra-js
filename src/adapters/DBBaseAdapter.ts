import { DBPool } from "../connections/DBPool";
import { IDBConfig } from "../interfaces/IDBconfig";

export class DBBaseAdapter {

    private pool: DBPool;

    constructor(config: IDBConfig) {
        this.pool = new DBPool(config);
    }

    getConnectionPool() { return this.pool; }

    end() {
        return this.pool.end();
    }

}
