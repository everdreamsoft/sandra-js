import { Sandra } from "../src/Sandra";
import { SandraSQLAdapter } from "../src/adapters/SandraSQLAdapter";
import { DB } from "../src/connections/DB";
import { IDBConfig } from "../src/interfaces/IDBconfig";
import { Concept } from "../src/models/Concept";
import { Reference } from "../src/models/Reference";
import { SystemConcepts } from "../src/models/SystemConcepts";
import { Common } from "../src/utils/Common";
import { JSONQuery } from "../src/utils/JSONQuery";
import { TemporaryId } from "../src/utils/TemporaryId";
import { Entity } from "../src/wrappers/Entity";
import { EntityFactory } from "../src/wrappers/EntityFactory";
import { BlockchainAddress } from "../src/wrappers/models/BlockchainAddress";
import { BlockchainAddressFactory } from "../src/wrappers/models/BlockchainAddressFactory";

export class Test {

    async run() {
        await this.testSandraSQL();
        //this.getbalance("0x15ba85c861463873fe78a6ac56cc0da8e94223a0", "sandra_linode_ranjit");
    }


    async testSandraSQL() {

        let a = new SandraSQLAdapter(DB_CONFIG_LINDT);

        let b = await a.getAssets({ assetId: "eSog-", moongaCardId: null, cannonAssetId: null, checkSubstring: true }, undefined, 100);

        console.log(b);

    }

    async testLoadCards(server: string = "sandra") {

        let query = {
            "is_a": "sogCard",
            "contained_in_file": "sogCardProdFile",
            "uniqueRef": "moongaCardId",
            "joined": {
                "bindToContract": {
                    "target": {
                        "is_a": "xcpContract",
                        "contained_in_file": "blockchainContractFile",
                        "uniqueRef": "id",
                        "refs": {
                            "id": "BTCMEETUPCD"
                        },
                        "options": {
                            "limit": 100000,
                            "load_data": true,
                            "load_triplets": {
                                "verbs": ["onBlockchain"]
                            }
                        }
                    }
                }
            },
            "options": {
                "limit": 100000,
                "load_data": true,
                "load_triplets": {
                    "verbs": ["bindToContract"]
                }
            }
        }

        let json = await JSONQuery.select(query, server);
        console.log(json);


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


    async getbalance(address: string, server: string) {

        TemporaryId.reset();

        // Keeping chain as empty to get general address 
        let factory = new BlockchainAddressFactory("", await SystemConcepts.get("address", server), server)
        let query = {
            "contained_in_file": "blockchainAddressFile",
            "uniqueRef": "address",
            "refs": {
                "address": address
            },
            "options": {
                "limit": 1,
                "load_data": false
            }
        }

        let addresses = await JSONQuery.select(query, server);

        if (addresses?.length > 0) {

            let sub = addresses[0].getSubject();

            if (sub)
                factory.addSubjectAsEntity(sub)

            let extendedObj: BlockchainAddress = factory.getEntities()[0] as BlockchainAddress;
            extendedObj.getRefs().push(await Common.createDBReference("address", address, undefined, server));

            let balances = await extendedObj.getBalances();

            console.log(balances);

        }

    }

    async loadTripletRefs(server: string) {

        let blockFactory: EntityFactory | undefined = new EntityFactory("blockchainBloc", "blockchainblocFile", await SystemConcepts.get("blockIndex", server), server);
        let klaytn_timestampConcept = await SystemConcepts.get("klaytn-timestamp", server);
        let eth_timestampConcept = await SystemConcepts.get("ethereum-timestamp", server);

        // Creating block entity
        let b = await blockFactory.create([
            await Common.createDBReference("blockIndex", "33637001", undefined, server),
            await Common.createDBReference("klaytn-timestamp", "1", undefined, server),
            await Common.createDBReference("ethereum-timestamp", "2", undefined, server),

        ]);

        let cifConcept = await SystemConcepts.get("contained_in_file", server);


        await blockFactory.loadAllSubjects();
        await blockFactory.loadTriplets(cifConcept, undefined, true);
        await blockFactory.loadAllTripletRefs([eth_timestampConcept, klaytn_timestampConcept]);
        await blockFactory.pushRefsBatch();

        console.log("");


    }
}

const LOCAL = false;

const DB_CONFIG: IDBConfig = {
    "name": "sandra",
    "user": "eds_skale",
    "database": "eds_sandra",
    "env": "",
    "host": "mysql-eds.alwaysdata.net",
    "password": "",
    "waitForConnections": true,
    "connectionLimit": 1,
    "queueLimit": 0,
    "enableKeepAlive": true,
    "tables": {
        "concepts": "Concept",
        "references": "`References`",
        "triplets": "Link",
        "datastorage": "storage"
    }
};

const DB_CONFIG_LOCAL = {
    "name": "sandra",
    "user": "root",
    "database": "sandra",
    "env": "",
    "host": "localhost",
    "password": "",
    "waitForConnections": true,
    "connectionLimit": 10,
    "queueLimit": 0,
    "enableKeepAlive": true,
};


const DB_CONFIG_LINDT = {
    "name": "sandra",
    "user": "lindt_ranjit",
    "database": "lindt_helvetia",
    "env": "balor",
    "host": "mysql-lindt.alwaysdata.net",
    "password": "!!Wak4bewq",
    "waitForConnections": true,
    "connectionLimit": 1,
    "queueLimit": 0,
    "enableKeepAlive": true,
};

Sandra.DB_CONFIG = LOCAL ? DB_CONFIG_LOCAL : DB_CONFIG;
Sandra.LOG_CONFIG = {
    enable: true,
    query: true
}

let test = new Test();

test.run();

