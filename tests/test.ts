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
            "is_a": "jwiProcess",
            "contained_in_file": "jwiProcessFile",
            "uniqueRef": "id",
            "refs": {
                "id": "binance_asset_daemon",
            },
            "joined": {
                "has": {
                    "target": {
                        "contained_in_file": "blockchainContractFile",
                        "uniqueRef": "id",
                        "refs": {
                            "id": "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
                        },
                        "push": false
                    },
                    "refs": { status: 'active', startBlock: '123', endBlock: '4343232', range: '1000' }
                }
            }
        };

        // let jsonQuery = {
        //     "is_a": "ethContract",
        //     "contained_in_file": "blockchainContractFile",
        //     "uniqueRef": "id",
        //     "refs": {
        //         "id": "test",
        //         "explicitListing": "1",
        //         "metadataType": "hte"
        //     },
        //     "brothers": {
        //         "onBlockchain": {
        //             "target": "ethereum"
        //         }
        //     },
        //     "joined": {
        //         "inCollection": {
        //             "target": {
        //                 "is_a": "assetCollection",
        //                 "contained_in_file": "assetCollectionFile",
        //                 "uniqueRef": "collectionId",
        //                 "refs": {
        //                     "collectionId": "test"
        //                 }
        //             },
        //             "refs": {
        //                 "assetKeyId": "test"
        //             }
        //         },
        //         "contractStandard": {
        //             "target": {
        //                 "is_a": "blockchainStandard",
        //                 "contained_in_file": "blockchainStandardFile",
        //                 "uniqueRef": "class_name",
        //                 "refs": {
        //                     "class_name": "erc721111",
        //                     "creationTimestamp": Math.floor(Date.now() / 1000)
        //                 },
        //                 "push": true
        //             }
        //         }
        //     }
        // }


        let c = await JSONQuery.push(jsonQuery, "sandra_linode_ranjit");

        console.log(c);

    }

    async testPull() {


        let subIds: string[] = [];
        let stdSubjIds: any = [];

        let jsonQuery = {
            "is_a": "jwiProcess",
            "contained_in_file": "jwiProcessFile",
            "uniqueRef": "id",
            "refs": {
                id: "ethereum" + "_" + "canonize"
            },
            "options": {
                "limit": 1,
                "load_data": true,
                "load_triplets": {
                    "verbs": ["has"]
                }
            }
        };

        let contractsQuery = {
            "contained_in_file": "blockchainContractFile",
            "uniqueRef": "id",
            "subjectIds": subIds,
            "options": {
                "limit": 99999,
                "load_data": true,
                "load_triplets": {
                    "verbs": ["contractStandard"]
                }
            }
        };

        let standardQeuery = {
            "contained_in_file": "blockchainStandardFile",
            "uniqueRef": "class_name",
            "subjectIds": stdSubjIds,
            "options": {
                "limit": 99999,
                "load_data": true,
            }
        };

        let process = await JSONQuery.selectAsJson(jsonQuery, "sandra_linode_ranjit");
        let contractJson: any[] = [];

        if (process?.length > 0) {

            process[0].joined?.forEach((e: any) => {
                if ("has" in e) {
                    subIds.push(e.has.subjectId);
                }
            });

            let contracts = await JSONQuery.selectAsJson(contractsQuery, "sandra_linode_ranjit");

            contracts?.forEach((c: any) => {
                c.joined?.find((s: any) => {
                    if (("contractStandard" in s)) {
                        stdSubjIds.push(s.contractStandard.subjectId)
                    }
                })
            })

            let stds = await JSONQuery.selectAsJson(standardQeuery, "sandra_linode_ranjit");


            contracts?.forEach((c: any) => {

                let scanDetails = process[0].joined?.find((p: any) => {
                    if (("has" in p) && p.has?.subjectId == c.subjectId)
                        return true;
                });

                let std = stds?.find((s: any) => {

                    let cs = c.joined?.find((s: any) => {
                        if (("contractStandard" in s)) {
                            return true;
                        }
                    });

                    if (cs) {
                        if (cs.subjectId = s.subjectId) return true;
                    }

                    return false;
                });

                let a = {
                    ...scanDetails?.has?.refs,
                    address: c.id,
                    standard: std?.class_name?.replace("CsCannon\\Blockchains\\Contracts\\", "")
                };

                contractJson.push(a);

            })

        }

        return Promise.resolve(contractJson);
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
    env: "raclette",
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

