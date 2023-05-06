import { Sandra } from "../src/Sandra";
import { SystemConcepts } from "../src/models/SystemConcepts";
import { IDBConfig } from "../src/interfaces/IDBconfig";
import { EntityFactory } from "../src/wrappers/EntityFactory";
import { DB } from "../src/connections/DB";
import { SandraAdapter } from "../src/adapters/SandraAdapter";
import { Common } from "../src/utils/Common";

export class Test {

    async run() {
        this.testDB();
    }

    async testAbortSignal() {

    }

    async testDBClass() {


        DB.getInstance().add(DB_CONFIG);

        let server = DB.getInstance().server("sandra_linode_ranjit")

        let con = server?.getConnectionPool();



        let res = await con?.query("select * from fondue_SandraConcept limit 10;");

        res = await con?.query("select * from fondue_SandraConcept limit 100;");

        res = await con?.query("select * from fondue_SandraConcept limit 1000;");

        console.log(con);

    }


    async testDB(server: string = "sandra") {
        //let controller = new AbortController();

        let blockFactory: EntityFactory | undefined = new EntityFactory("blockchainBloc", "blockchainblocFile", await SystemConcepts.get("blockIndex", server), server);

        for (let i = 0; i < 10; i++) {
            let b = await blockFactory.create([
                await Common.createDBReference("blockIndex", String(i), undefined, server),
            ]);
        }

        await blockFactory.loadAllSubjects();

        console.log("a");

    }

}

const LOCAL = true;

const DB_CONFIG: IDBConfig = {
    name: "sandra_linode_ranjit",
    database: "jetski",
    host: "139.162.176.241",
    env: "fondue",
    password: "4TyijLEBEZHJ1hsabPto",
    user: "remote1",
    connectionLimit: 10,
    queueLimit: 0,
    waitForConnections: true
};

const DB_CONFIG_LOCAL = {
    "name": "sandra",
    "user": "root",
    "database": "jetski",
    "env": "fondue",
    "host": "localhost",
    "password": "",
    "waitForConnections": true,
    "connectionLimit": 10,
    "queueLimit": 0,
    "enableKeepAlive": true
};

Sandra.DB_CONFIG = LOCAL ? DB_CONFIG_LOCAL : DB_CONFIG;
Sandra.LOG_CONFIG = {
    enable: true,
    query: {
        enable: true,
        time: true,
        values: true
    }
}

let test = new Test();

test.run();

