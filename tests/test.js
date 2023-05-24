"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Test = void 0;
const Sandra_1 = require("../src/Sandra");
const DB_1 = require("../src/connections/DB");
const Concept_1 = require("../src/models/Concept");
const SystemConcepts_1 = require("../src/models/SystemConcepts");
const Common_1 = require("../src/utils/Common");
const JSONQuery_1 = require("../src/utils/JSONQuery");
const TemporaryId_1 = require("../src/utils/TemporaryId");
const EntityFactory_1 = require("../src/wrappers/EntityFactory");
const BlockchainAddressFactory_1 = require("../src/wrappers/models/BlockchainAddressFactory");
class Test {
    async run() {
        this.getbalance("0x15ba85c861463873fe78a6ac56cc0da8e94223a0", "sandra_linode_ranjit");
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
        let c = await JSONQuery_1.JSONQuery.push(jsonQuery, "sandra_linode_ranjit");
        console.log(c);
    }
    async testPull() {
        var _a;
        let subIds = [];
        let stdSubjIds = [];
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
        let process = await JSONQuery_1.JSONQuery.selectAsJson(jsonQuery, "sandra_linode_ranjit");
        let contractJson = [];
        if ((process === null || process === void 0 ? void 0 : process.length) > 0) {
            (_a = process[0].joined) === null || _a === void 0 ? void 0 : _a.forEach((e) => {
                if ("has" in e) {
                    subIds.push(e.has.subjectId);
                }
            });
            let contracts = await JSONQuery_1.JSONQuery.selectAsJson(contractsQuery, "sandra_linode_ranjit");
            contracts === null || contracts === void 0 ? void 0 : contracts.forEach((c) => {
                var _a;
                (_a = c.joined) === null || _a === void 0 ? void 0 : _a.find((s) => {
                    if (("contractStandard" in s)) {
                        stdSubjIds.push(s.contractStandard.subjectId);
                    }
                });
            });
            let stds = await JSONQuery_1.JSONQuery.selectAsJson(standardQeuery, "sandra_linode_ranjit");
            contracts === null || contracts === void 0 ? void 0 : contracts.forEach((c) => {
                var _a, _b, _c;
                let scanDetails = (_a = process[0].joined) === null || _a === void 0 ? void 0 : _a.find((p) => {
                    var _a;
                    if (("has" in p) && ((_a = p.has) === null || _a === void 0 ? void 0 : _a.subjectId) == c.subjectId)
                        return true;
                });
                let std = stds === null || stds === void 0 ? void 0 : stds.find((s) => {
                    var _a;
                    let cs = (_a = c.joined) === null || _a === void 0 ? void 0 : _a.find((s) => {
                        if (("contractStandard" in s)) {
                            return true;
                        }
                    });
                    if (cs) {
                        if (cs.subjectId = s.subjectId)
                            return true;
                    }
                    return false;
                });
                let a = Object.assign(Object.assign({}, (_b = scanDetails === null || scanDetails === void 0 ? void 0 : scanDetails.has) === null || _b === void 0 ? void 0 : _b.refs), { address: c.id, standard: (_c = std === null || std === void 0 ? void 0 : std.class_name) === null || _c === void 0 ? void 0 : _c.replace("CsCannon\\Blockchains\\Contracts\\", "") });
                contractJson.push(a);
            });
        }
        return Promise.resolve(contractJson);
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
    async getbalance(address, server) {
        TemporaryId_1.TemporaryId.reset();
        // Keeping chain as empty to get general address 
        let factory = new BlockchainAddressFactory_1.BlockchainAddressFactory("", await SystemConcepts_1.SystemConcepts.get("address", server), server);
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
        };
        let addresses = await JSONQuery_1.JSONQuery.select(query, server);
        if ((addresses === null || addresses === void 0 ? void 0 : addresses.length) > 0) {
            let sub = addresses[0].getSubject();
            if (sub)
                factory.addSubjectAsEntity(sub);
            let extendedObj = factory.getEntities()[0];
            extendedObj.getRefs().push(await Common_1.Common.createDBReference("address", address, undefined, server));
            let balances = await extendedObj.getBalances();
            console.log(balances);
        }
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