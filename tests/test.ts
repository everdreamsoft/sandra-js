import { Sandra } from "../src/Sandra";
import { DB } from "../src/connections/DB";
import { IDBConfig } from "../src/interfaces/IDBconfig";
import { Concept } from "../src/models/Concept";
import { SystemConcepts } from "../src/models/SystemConcepts";
import { Common } from "../src/utils/Common";
import { JSONQuery } from "../src/utils/JSONQuery";
import { EntityFactory } from "../src/wrappers/EntityFactory";

export class Test {

    async run() {
        this.testPull();
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
        }


        let c = await JSONQuery.push(jsonQuery, "sandra_linode_ranjit");

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
        }
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

        let c = await JSONQuery.selectAsJson(query, "sandra_linode_ranjit");

        console.log(c);
    }


    async testDB(server: string = "sandra") {

        console.log(Sandra.getDBConfig());

        await Sandra.close(server);

        //let controller = new AbortController();
        let tokenPathFactory: EntityFactory | undefined = new EntityFactory("tokenPath", "tokenPathFile", await SystemConcepts.get("code", server), server);


        let token = await tokenPathFactory.create([
            await Common.createDBReference("code", "tokenId" + "-" + 0, undefined, server),
        ]);

        let contractSub = new Concept("962283", "", "");
        let contractSub1 = new Concept("12311", "", "");

        await token.addTriplet(contractSub, contractSub1);
        await tokenPathFactory.loadAllSubjects();
        await tokenPathFactory.loadTriplets(contractSub, contractSub1);

        await tokenPathFactory.pushTripletsBatchWithVerb(contractSub, true);

        console.log("a");

    }

}

const LOCAL = false;

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
    query: true
}

let test = new Test();

test.run();

