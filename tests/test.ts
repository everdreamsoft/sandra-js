import { DBAdapter } from "../src/DBAdapter";
import { Sandra } from "../src/Sandra";
import mysql from 'mysql2/promise';
import { SystemConcepts } from "../src/SystemConcepts";
import { Triplet } from "../src/Triplet";
import { Concept } from "../src/Concept";
import { Reference } from "../src/Reference";
import { IDBConfig } from "../src/interfaces/IDBconfig";
import { EntityFactory } from "../src/EntityFactory";
import { Utils } from "../src/Utils";

export class Test {

    async run() {

        this.testDB();


    }

    async testDB() {

        let controller = new AbortController();

        let facotry = new EntityFactory("planet", "planet_file", await SystemConcepts.get("name"))

        await facotry.create([
            await Utils.createDBReference("name", "planetABC1")
        ]);

        await facotry.create([
            await Utils.createDBReference("name", "PlanetABC2")
        ]);

        await facotry.loadAllSubjects();
        await facotry.pushBatch();

        console.log("a");
        
    }

}

const LOCAL = true;

const DB_CONFIG: IDBConfig = {
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

Sandra.DB_CONFIG = LOCAL ? DB_CONFIG_LOCAL : DB_CONFIG;

let test = new Test();

console.log(Sandra.getDBConfig());
console.log(Sandra.DB_CONFIG);

test.run();

