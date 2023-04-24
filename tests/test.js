"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Test = void 0;
const Sandra_1 = require("../src/Sandra");
const SystemConcepts_1 = require("../src/SystemConcepts");
const EntityFactory_1 = require("../src/EntityFactory");
const Utils_1 = require("../src/Utils");
class Test {
    async run() {
        this.testDB();
    }
    async testDB() {
        let controller = new AbortController();
        let facotry = new EntityFactory_1.EntityFactory("planet", "planet_file", await SystemConcepts_1.SystemConcepts.get("name"));
        await facotry.create([
            await Utils_1.Utils.createDBReference("name", "planetABC1")
        ]);
        await facotry.create([
            await Utils_1.Utils.createDBReference("name", "PlanetABC2")
        ]);
        await facotry.loadAllSubjects();
        await facotry.pushTripletsBatch();
        await facotry.pushRefsBatch();
        console.log("a");
    }
}
exports.Test = Test;
const LOCAL = true;
const DB_CONFIG = {
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
let test = new Test();
console.log(Sandra_1.Sandra.getDBConfig());
console.log(Sandra_1.Sandra.DB_CONFIG);
test.run();
//# sourceMappingURL=test.js.map