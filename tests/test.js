"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Test = void 0;
const Sandra_1 = require("../src/Sandra");
const SystemConcepts_1 = require("../src/models/SystemConcepts");
const EntityFactory_1 = require("../src/wrappers/EntityFactory");
const DB_1 = require("../src/connections/DB");
const Common_1 = require("../src/utils/Common");
class Test {
    async run() {
        this.testDB();
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
    async testDB(server = "sandra") {
        //let controller = new AbortController();
        let blockFactory = new EntityFactory_1.EntityFactory("blockchainBloc", "blockchainblocFile", await SystemConcepts_1.SystemConcepts.get("blockIndex", server), server);
        for (let i = 0; i < 10; i++) {
            let b = await blockFactory.create([
                await Common_1.Common.createDBReference("blockIndex", String(i), undefined, server),
            ]);
        }
        await blockFactory.loadAllSubjects();
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