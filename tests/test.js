"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Test = void 0;
const Sandra_1 = require("../src/Sandra");
const SystemConcepts_1 = require("../src/models/SystemConcepts");
const EntityFactory_1 = require("../src/wrappers/EntityFactory");
const DB_1 = require("../src/connections/DB");
class Test {
    async run() {
        this.testDBClass();
    }
    async testAbortSignal() {
    }
    async testDBClass() {
        DB_1.DB.getInstance().add(DB_CONFIG);
        let server = DB_1.DB.getInstance().server("sandra_linode_ranjit");
        let con = server === null || server === void 0 ? void 0 : server.getConnectionPool();
        let res = await (con === null || con === void 0 ? void 0 : con.query("select * from fondue_SandraConcept limit 10;"));
        res = await (con === null || con === void 0 ? void 0 : con.query("select * from fondue_SandraConcept limit 100;"));
        res = await (con === null || con === void 0 ? void 0 : con.query("select * from fondue_SandraConcept limit 1000;"));
        console.log(con);
    }
    async testDB() {
        //let controller = new AbortController();
        let facotry = new EntityFactory_1.EntityFactory("planet", "planet_file", await SystemConcepts_1.SystemConcepts.get("name"));
        await facotry.loadEntityConcepts();
        await facotry.loadEntityConceptsRefs();
        console.log("a");
    }
}
exports.Test = Test;
const LOCAL = true;
const DB_CONFIG = {
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
Sandra_1.Sandra.DB_CONFIG = LOCAL ? DB_CONFIG_LOCAL : DB_CONFIG;
Sandra_1.Sandra.LOG_CONFIG = {
    enable: true,
    query: {
        enable: true,
        time: true,
        values: true
    }
};
let test = new Test();
test.run();
//# sourceMappingURL=test.js.map