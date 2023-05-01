import { Sandra } from "../src/Sandra";
import { SystemConcepts } from "../src/models/SystemConcepts";
import { IDBConfig } from "../src/interfaces/IDBconfig";
import { EntityFactory } from "../src/wrappers/EntityFactory";
import { DB } from "../src/connections/DB";
import { SandraAdapter } from "../src/adapters/SandraAdapter";

export class Test {

    async run() {
        this.testDBClass();
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


    async testDB() {
        //let controller = new AbortController();
        let facotry = new EntityFactory("planet", "planet_file", await SystemConcepts.get("name"))
        await facotry.loadEntityConcepts();
        await facotry.loadEntityConceptsRefs();
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
    name: "sandra_local",
    database: "ccc8_batch",
    host: "localhost",
    env: "fondue",
    password: "",
    user: "root",
    connectionLimit: 10,
    queueLimit: 0,
    waitForConnections: true

};

Sandra.DB_CONFIG = LOCAL ? DB_CONFIG_LOCAL : DB_CONFIG;
Sandra.LOG_CONFIG = {
    main: true,
    query: false,
    queryTime: false

}
let test = new Test();

test.run();

