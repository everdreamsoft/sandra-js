"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Test = void 0;
const Sandra_1 = require("../src/Sandra");
const DB_1 = require("../src/connections/DB");
const Concept_1 = require("../src/models/Concept");
const SystemConcepts_1 = require("../src/models/SystemConcepts");
const Common_1 = require("../src/utils/Common");
const JSONQuery_1 = require("../src/utils/JSONQuery");
const EntityFactory_1 = require("../src/wrappers/EntityFactory");
class Test {
    async run() {
        this.testPull();
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
    async testFilter() {
        let jsonQuery = {
            "is_a": "ethContract",
            "contained_in_file": "blockchainContractFile",
            "uniqueRef": "id",
            "refs": {
                "id": "test",
                "explicitListing": "1",
                "metadataType": "hte"
            },
            "brothers": {
                "onBlockchain": {
                    "target": "ethereum"
                }
            },
            "joined": {
                "inCollection": {
                    "target": {
                        "is_a": "assetCollection",
                        "contained_in_file": "assetCollectionFile",
                        "uniqueRef": "collectionId",
                        "refs": {
                            "collectionId": "test"
                        }
                    },
                    "refs": {
                        "assetKeyId": "test"
                    }
                },
                "contractStandard": {
                    "target": {
                        "is_a": "blockchainStandard",
                        "contained_in_file": "blockchainStandardFile",
                        "uniqueRef": "class_name",
                        "refs": {
                            "class_name": "erc721111",
                            "creationTimestamp": Math.floor(Date.now() / 1000)
                        },
                        "push": true
                    }
                }
            }
        };
        let c = await JSONQuery_1.JSONQuery.push(jsonQuery, "sandra_linode_ranjit");
        console.log(c);
    }
    async testPull() {
        // let query = {
        //     "contained_in_file": "blockchainContractFile",
        //     "uniqueRef": "id",
        //     "joined": {
        //         "inCollection": {
        //             "target": {
        //                 "is_a": "assetCollection",
        //                 "contained_in_file": "assetCollectionFile",
        //                 "uniqueRef": "collectionId",
        //                 "refs": {
        //                     "collectionId": "test"
        //                 }
        //             }
        //         },
        //         "contractStandard": {
        //             "load_data": true
        //         }
        //     },
        //     "options": {
        //         "limit": 9999,
        //         "load_data": true
        //     }
        // }
        let query = {
            "is_a": "jwiProcess",
            "contained_in_file": "jwiProcessFile",
            "uniqueRef": "id",
            "joined": {
                "has": {
                    "target": {
                        "is_a": "ethContract",
                        "contained_in_file": "blockchainContractFile",
                        "uniqueRef": "id",
                        "refs": {
                            "id": "0x9227a3d959654c8004fa77dffc380ec40880fff6"
                        }
                    }
                }
            },
            "options": {
                "limit": 1,
                "load_data": true,
                "load_refs": {
                    "verbs": ["contained_in_file", "has"]
                }
            }
        };
        // let query = {
        //     "contained_in_file": "blockchainStandardFile",
        //     "uniqueRef": "class_name",
        //     "subjectIds": ["329816"],
        //     "options": {
        //         "limit": 100,
        //         "load_data": true
        //     }
        // }
        console.log("");
        let c = await JSONQuery_1.JSONQuery.selectAsJson(query, "sandra_linode_ranjit");
        console.log(c);
    }
    async testDB(server = "sandra") {
        console.log(Sandra_1.Sandra.getDBConfig());
        await Sandra_1.Sandra.close(server);
        //let controller = new AbortController();
        let tokenPathFactory = new EntityFactory_1.EntityFactory("tokenPath", "tokenPathFile", await SystemConcepts_1.SystemConcepts.get("code", server), server);
        let token = await tokenPathFactory.create([
            await Common_1.Common.createDBReference("code", "tokenId" + "-" + 0, undefined, server),
        ]);
        let contractSub = new Concept_1.Concept("962283", "", "");
        let contractSub1 = new Concept_1.Concept("12311", "", "");
        await token.addTriplet(contractSub, contractSub1);
        await tokenPathFactory.loadAllSubjects();
        await tokenPathFactory.loadTriplets(contractSub, contractSub1);
        await tokenPathFactory.pushTripletsBatchWithVerb(contractSub, true);
        console.log("a");
    }
}
exports.Test = Test;
const LOCAL = false;
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
    query: true
};
let test = new Test();
test.run();
//# sourceMappingURL=test.js.map