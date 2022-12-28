"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Test = void 0;
const APIService_1 = require("../src/APIService");
const Concept_1 = require("../src/Concept");
const DBAdapter_1 = require("../src/DBAdapter");
const EntityFactory_1 = require("../src/EntityFactory");
const Sandra_1 = require("../src/Sandra");
const SystemConcepts_1 = require("../src/SystemConcepts");
const TemporaryId_1 = require("../src/TemporaryId");
const Triplet_1 = require("../src/Triplet");
const Utils_1 = require("../src/Utils");
class Test {
    async testBlockLoad() {
        let blockFactory = new EntityFactory_1.EntityFactory("blockchainBloc", "blockchainblocFile", await SystemConcepts_1.SystemConcepts.get("blockIndex"));
        // Load all entity triplets 
        await blockFactory.load(await Utils_1.Utils.createDBReference("ethereum-timestamp", "1"), false, false, 1000);
        await blockFactory.loadAllTripletRefs();
        // Update timestamp
        for (let i = 0; i < blockFactory.getEntities().length; i++) {
            let block = blockFactory.getEntities()[i];
            let blockNumRef = block.getRef(await SystemConcepts_1.SystemConcepts.get("blockIndex"));
            let valueRef = block.getRef(await SystemConcepts_1.SystemConcepts.get("ethereum-timestamp"));
            valueRef.setValue("2");
        }
        await blockFactory.batchRefUpdate(await SystemConcepts_1.SystemConcepts.get("ethereum-timestamp"));
    }
    async testBlocktimeUpdate() {
        console.log("inserting...");
        let startTime = Date.now();
        let blockFactory = new EntityFactory_1.EntityFactory("blockchainBloc", "blockchainblocFile", await SystemConcepts_1.SystemConcepts.get("blockIndex"));
        for (let i = 0; i < 50000; i++) {
            let b = await blockFactory.create([
                await Utils_1.Utils.createDBReference("blockIndex", i.toString()),
                await Utils_1.Utils.createDBReference("ethereum-timestamp", "1"),
                await Utils_1.Utils.createDBReference("creationTimestamp", "1"),
            ]);
        }
        let memCrtTime = Date.now();
        await blockFactory.loadAllSubjects();
        let loadSTime = Date.now();
        await blockFactory.pushBatch();
        let endTime = Date.now();
        let batchTime = ((endTime - startTime) / 1000);
        let memTime = ((memCrtTime - startTime) / 1000);
        let loadTime = ((loadSTime - memCrtTime) / 1000);
        let insertTime = ((endTime - loadSTime) / 1000);
        console.log("blocks added..");
        console.log("Mem entity time " + memTime);
        console.log("Loading time " + loadTime);
        console.log("Insert time " + insertTime);
        console.log("Total Batch time " + batchTime);
    }
    async testProcessEntity() {
        let processFactory = new EntityFactory_1.EntityFactory("jwiProcess", "jwiProcessFile", await SystemConcepts_1.SystemConcepts.get("jwiId"));
        let contractFactory = new EntityFactory_1.EntityFactory("ethContract", "blockchainContractFile", await SystemConcepts_1.SystemConcepts.get("id"));
        await processFactory.load(await Utils_1.Utils.createDBReference("jwiId", "evm_jetski_ethereum"));
        // Get all the joined contracts 
        let e = processFactory.getEntities()[0];
        // Joined address subjects
        let trips = e.getTriplets().filter(t => {
            return t.getVerb().getShortname() == "joinedAddress";
        });
        for (let i = 0; i < trips.length; i++) {
            let e = await contractFactory.loadBySubject(trips[i].getTarget());
            contractFactory.getEntities().push(e);
        }
        let contracts = [];
        contractFactory.getEntities().forEach(e => {
            contracts.push(e.getEntityRefsAsJson());
        });
        console.log("");
    }
    async testEntityUpsert() {
        console.log("started test");
        let planetFactory = new EntityFactory_1.EntityFactory("planet", "planet_file", await SystemConcepts_1.SystemConcepts.get("name"));
        let p1 = await planetFactory.create([
            await Utils_1.Utils.createDBReference("name", "earth1"),
            await Utils_1.Utils.createDBReference("age", "3.5B"),
            await Utils_1.Utils.createDBReference("atm", "yes")
        ], true);
        await p1.brother("hasMoon", "no", [], false);
        await planetFactory.loadAllSubjects();
        await planetFactory.push();
        console.log("Done");
        process.exit();
    }
    async testEntityPush() {
        console.log("started test");
        let planetFactory = new EntityFactory_1.EntityFactory("exo_planet", "exo_planet_file", await SystemConcepts_1.SystemConcepts.get("name"));
        let moonFactory = new EntityFactory_1.EntityFactory("moon", "moon_file", await SystemConcepts_1.SystemConcepts.get("name"));
        await planetFactory.create([
            await Utils_1.Utils.createDBReference("name", "earth1"),
            await Utils_1.Utils.createDBReference("age", "3.5B")
        ]);
        await planetFactory.create([
            await Utils_1.Utils.createDBReference("name", "venus1"),
            await Utils_1.Utils.createDBReference("age", "3.5B")
        ]);
        let e = await planetFactory.create([
            await Utils_1.Utils.createDBReference("name", "earth1"),
            await Utils_1.Utils.createDBReference("age", "3B"),
            await Utils_1.Utils.createDBReference("atmosphere", "yes"),
            await Utils_1.Utils.createDBReference("pressure", "1"),
            await Utils_1.Utils.createDBReference("habitable", "yes"),
        ]);
        await e.brother("hasMoon", "yes");
        let moon1 = await moonFactory.create([await Utils_1.Utils.createDBReference("name", "moon1")]);
        await e.join("moon", moon1);
        await moonFactory.loadAllSubjects();
        await planetFactory.loadAllSubjects();
        await planetFactory.push();
        console.log("Done");
        process.exit();
    }
    async testEnityLoad() {
        let planetFactory = new EntityFactory_1.EntityFactory("exo_planet", "exo_planet_file", await SystemConcepts_1.SystemConcepts.get("name"));
        await planetFactory.load(await Utils_1.Utils.createDBReference("name", "earth"));
        console.log("");
    }
    async testEnityLoadAll() {
        let planetFactory = new EntityFactory_1.EntityFactory("exo_planet", "exo_planet_file", await SystemConcepts_1.SystemConcepts.get("name"));
        await planetFactory.loadEntityConcepts(null, "2");
        console.log("");
    }
    async testBatchPush() {
        console.log("started test");
        let planetFactory = new EntityFactory_1.EntityFactory("exo_planet", "exo_planet_file", await SystemConcepts_1.SystemConcepts.get("name"));
        let moonFactory = new EntityFactory_1.EntityFactory("moon", "moon_file", await SystemConcepts_1.SystemConcepts.get("name"));
        await planetFactory.create([
            await Utils_1.Utils.createDBReference("name", "earth1"),
            await Utils_1.Utils.createDBReference("age", "3.5B")
        ]);
        await planetFactory.create([
            await Utils_1.Utils.createDBReference("name", "venus1"),
            await Utils_1.Utils.createDBReference("age", "3.5B")
        ]);
        let e = await planetFactory.create([
            await Utils_1.Utils.createDBReference("name", "earth1"),
            await Utils_1.Utils.createDBReference("age", "3B"),
            await Utils_1.Utils.createDBReference("atmosphere", "yes"),
            await Utils_1.Utils.createDBReference("pressure", "1"),
            await Utils_1.Utils.createDBReference("habitable", "yes"),
        ]);
        await e.brother("hasMoon", "yes");
        await e.brother("hasMoon", "yes");
        await e.brother("hasMoon", "yes");
        await e.brother("hasMoon", "yes");
        await e.brother("hasMoon", "yes", [
            await Utils_1.Utils.createDBReference("total", "1"),
            await Utils_1.Utils.createDBReference("test", "2"),
        ]);
        await e.brother("hasMoon", "yes", [
            await Utils_1.Utils.createDBReference("total", "2"),
            await Utils_1.Utils.createDBReference("test1", "3"),
        ]);
        let moon1 = await moonFactory.create([await Utils_1.Utils.createDBReference("name", "moon1")]);
        let moon2 = await moonFactory.create([await Utils_1.Utils.createDBReference("name", "moon2")]);
        await e.join("moon", moon1);
        await e.join("moon", moon1);
        await e.join("moon", moon2);
        await moonFactory.pushBatch();
        await planetFactory.pushBatch();
        console.log("Done");
        process.exit();
    }
    async testBatchSpeed() {
        console.log("inserting..");
        let startTime = Date.now();
        let planetFactory = new EntityFactory_1.EntityFactory("planet", "planet_file", await SystemConcepts_1.SystemConcepts.get("name"));
        for (let i = 0; i < 1; i++) {
            await planetFactory.create([
                await Utils_1.Utils.createDBReference("name", "planet" + i),
            ]);
        }
        let memCrtTime = Date.now();
        await planetFactory.loadAllSubjects();
        let loadSTime = Date.now();
        await planetFactory.pushBatch();
        let endTime = Date.now();
        console.log("pushed one batch, time taken - " + ((endTime - startTime) / 1000));
        let batchTime = ((endTime - startTime) / 1000);
        let memTime = ((memCrtTime - startTime) / 1000);
        let loadTime = ((loadSTime - memCrtTime) / 1000);
        let insertTime = ((endTime - loadSTime) / 1000);
        console.log("Mem entity time " + memTime);
        console.log("Loading time " + loadTime);
        console.log("Insert time " + insertTime);
        console.log("Total Batch time " + batchTime);
    }
    async testMaxIdInsert() {
        try {
            for (let i = 0; i < 1000; i++) {
                (await DBAdapter_1.DBAdapter.getInstance());
                await (await DBAdapter_1.DBAdapter.getInstance()).beginTransaction();
                await (await DBAdapter_1.DBAdapter.getInstance()).lockTables(true);
                let a = await (await DBAdapter_1.DBAdapter.getInstance()).getMaxConceptId();
                //await (await DBAdapter.getInstance()).addConceptWithMaxRange(Number(a) + 10);
                await (await DBAdapter_1.DBAdapter.getInstance()).unlockTable();
                // await (await DBAdapter.getInstance()).sleep(1);
                await (await DBAdapter_1.DBAdapter.getInstance()).commit();
            }
            console.log("complete");
            process.exit();
        }
        catch (e) {
            console.log(e);
            await (await DBAdapter_1.DBAdapter.getInstance()).close();
        }
    }
    async loadPendingEvents() {
        var _a;
        Sandra_1.Sandra.APP_CONFIG = {
            IPFSServiceUrl: "https://ipfsc.crystalsuite.com/"
        };
        let res = await APIService_1.APIService.get("ipfs://QmTDcCdt3yb6mZitzWBmQr65AW6Wska295Dg9nbEYpSUDR/2");
        let eventFactory = new EntityFactory_1.EntityFactory("blockchainEvent", "blockchainEventFile", await SystemConcepts_1.SystemConcepts.get("txHash"));
        let contractFactory = new EntityFactory_1.EntityFactory("ethContract", "blockchainContractFile", await SystemConcepts_1.SystemConcepts.get("id"));
        let tokenPathFactory = new EntityFactory_1.EntityFactory("tokenPath", "tokenPathFile", await SystemConcepts_1.SystemConcepts.get("code"));
        let assetFactory = new EntityFactory_1.EntityFactory("blockchainizableAsset", "blockchainizableAssets", await SystemConcepts_1.SystemConcepts.get("assetId"));
        await contractFactory.load(await Utils_1.Utils.createDBReference("id", "0x9227a3d959654c8004fa77dffc380ec40880fff6"), true);
        if (((_a = contractFactory.getEntities()) === null || _a === void 0 ? void 0 : _a.length) == 0) {
            throw new Error("Contract not found");
        }
        let contract = contractFactory.getEntities()[0];
        let subConcept = new Concept_1.Concept(TemporaryId_1.TemporaryId.create(), Concept_1.Concept.ENTITY_CONCEPT_CODE_PREFIX +
            eventFactory.getIsAVerb(), null);
        let t = new Triplet_1.Triplet(TemporaryId_1.TemporaryId.create(), subConcept, await SystemConcepts_1.SystemConcepts.get("assetStatus"), await SystemConcepts_1.SystemConcepts.get("pending"));
        let t1 = new Triplet_1.Triplet(TemporaryId_1.TemporaryId.create(), subConcept, await SystemConcepts_1.SystemConcepts.get("onBlockchain"), await SystemConcepts_1.SystemConcepts.get("ethereum"));
        let t2 = new Triplet_1.Triplet(TemporaryId_1.TemporaryId.create(), subConcept, await SystemConcepts_1.SystemConcepts.get("blockchainContract"), contract.getSubject());
        await eventFactory.loadByTriplet([t, t1, t2], 100);
        await eventFactory.loadAllTripletRefs();
        let tokenList = [];
        let assetStatusVerb = await SystemConcepts_1.SystemConcepts.get("assetStatus");
        let completedVerb = await SystemConcepts_1.SystemConcepts.get("completed");
        // Get tokens 
        for (let i = 0; i < eventFactory.getEntities().length; i++) {
            // Get token from reference with triplet link as t2
            let e = eventFactory.getEntities()[i];
            let tokenRef = e.getRef(await SystemConcepts_1.SystemConcepts.get("tokenId"));
            if (tokenRef) {
                tokenList.push(tokenRef.getValue());
            }
            let t = e.getTriplets().find(t => { return t.getVerb().isSame(assetStatusVerb); });
            t.setTarget(completedVerb);
            t.setUpsert(true);
        }
        // Get asset base meta data link for the collection and contract
        await tokenPathFactory.loadAllSubjects();
        let inCollectionVerb = await SystemConcepts_1.SystemConcepts.get("inCollection");
        let assetKeyIdConcept = await SystemConcepts_1.SystemConcepts.get("assetKeyId");
        let baseTokenVerb = await SystemConcepts_1.SystemConcepts.get("baseTokenUrl");
        let codeVerb = await SystemConcepts_1.SystemConcepts.get("code");
        let bindToCollVerb = await SystemConcepts_1.SystemConcepts.get("bindToCollection");
        // Finding all inCollection triplets 
        let collectionTriplet = contract.getTriplets().filter(t => {
            return t.getVerb().isSame(inCollectionVerb);
        });
        // Get contract triplets for contract/colletion to get tokeuri and assetid 
        for (let i = 0; i < collectionTriplet.length; i++) {
            let t = collectionTriplet[i];
            let assetKeyIdRef = contract.getRefs().find(r => {
                return r.getTripletLink().getId() == t.getId() && r.getIdConcept().isSame(assetKeyIdConcept);
            });
            let baseUrlRef = contract.getRefs().find(r => {
                return r.getTripletLink().getId() == t.getId() && r.getIdConcept().isSame(baseTokenVerb);
            });
            let assetId = assetKeyIdRef === null || assetKeyIdRef === void 0 ? void 0 : assetKeyIdRef.getValue();
            let baseTokenUrl = baseUrlRef === null || baseUrlRef === void 0 ? void 0 : baseUrlRef.getValue();
            for (let j = 0; j < tokenList.length; j++) {
                let tokenId = tokenList[j];
                let assetUrl = baseTokenUrl.replace("#TOKEN#", tokenId);
                let res = await APIService_1.APIService.get(assetUrl);
                let assetData;
                if (res.data) {
                    assetData = {
                        assetId: assetId.includes("#TOKENID#") ? Utils_1.Utils.getHash(res.data) : res.data[assetId],
                        name: res.data.name || "Not Known",
                        imageUrl: res.data.image || "",
                        description: res.data.description || "",
                        test: res.data.test || "te",
                        metadata: assetUrl
                    };
                }
                else {
                    assetData = {
                        assetId: "NOT_FOUND",
                        name: "Not Found",
                        imageUrl: "",
                        description: "",
                        metadata: ""
                    };
                }
                let asset = await assetFactory.create([
                    await Utils_1.Utils.createDBReference("assetId", assetData.assetId),
                    await Utils_1.Utils.createDBReference("name", assetData.name),
                    await Utils_1.Utils.createDBReference("imgURL", assetData.imageUrl),
                    await Utils_1.Utils.createDBReference("description", assetData.description),
                    await Utils_1.Utils.createDBReference("metaDataURL", assetData.metadata),
                ]);
                await asset.join("bindToContract", contract);
                await asset.addTriplet(bindToCollVerb, t.getTarget());
                let token = await tokenPathFactory.create([
                    await Utils_1.Utils.createDBReference("code", "tokenId" + "-" + tokenId)
                ]);
                await token.addTriplet(contract.getSubject(), asset.getSubject());
            }
        }
        await assetFactory.loadAllSubjects();
        await tokenPathFactory.loadAllSubjects();
        await assetFactory.pushBatch();
        await tokenPathFactory.pushTripletsBatch();
        await eventFactory.upsertTripletsBatch();
        console.log("loaded...");
    }
    async insertIgnoreRef() {
        let blockFactory = new EntityFactory_1.EntityFactory("blockchainBloc", "blockchainblocFile", await SystemConcepts_1.SystemConcepts.get("blockIndex"));
        for (let i = 0; i < 100; i++) {
            let b = await blockFactory.create([
                await Utils_1.Utils.createDBReference("blockIndex", i.toString()),
                await Utils_1.Utils.createDBReference("ethereum1-timestamp", "1"),
                await Utils_1.Utils.createDBReference("creationTimestamp", "1"),
            ]);
            await b.brother("asset", "5");
        }
        await blockFactory.loadAllSubjects();
        //await blockFactory.loadTriplets();
        // await blockFactory.loadAllTripletRefs();
        //await blockFactory.pushRefsBatch();
        await blockFactory.pushTripletsBatch();
        await blockFactory.pushBatch();
        console.log("");
    }
    async testDeadlockScenario() {
    }
    async loadTransaction() {
        var _a;
        let eventFactory = new EntityFactory_1.EntityFactory("blockchainEvent", "blockchainEventFile", await SystemConcepts_1.SystemConcepts.get("txHash"));
        await eventFactory.load(await Utils_1.Utils.createDBReference("parentHash", "0xb469cc14a7aa306b1a7cc1481d2e4da8d40e5644be2f70f5fa505584ff28b7c3"), true);
        (_a = eventFactory.getEntities()) === null || _a === void 0 ? void 0 : _a.forEach(e => {
            console.log(e.getEntityRefsAsJson());
        });
        console.log(eventFactory.getEntities()[0].getEntityRefsAsJson());
    }
    async pushTriplets() {
        let assetLinkData = {
            collection: "mutant-ape-yacht-club",
            contract: "0x60e4d786628fea6478f785a6d7e704777c86a7c6",
            assetKeyId: "#TOKENID#",
            baseTokenUrl: "https://boredapeyachtclub.com/api/mutants/#TOKEN#"
        };
        let collectionFactory = new EntityFactory_1.EntityFactory("assetCollection", "assetCollectionFile", await SystemConcepts_1.SystemConcepts.get("collectionId"));
        let contractFactory = new EntityFactory_1.EntityFactory("ethContract", "blockchainContractFile", await SystemConcepts_1.SystemConcepts.get("id"));
        let collection = await collectionFactory.create([
            await Utils_1.Utils.createDBReference("collectionId", assetLinkData.collection),
        ]);
        let c = await contractFactory.create([
            await Utils_1.Utils.createDBReference("id", assetLinkData.contract),
        ]);
        await collectionFactory.loadAllSubjects();
        await contractFactory.loadAllSubjects();
        await contractFactory.loadTriplets();
        await contractFactory.loadAllTripletRefs();
        let inCollectionVerb = await SystemConcepts_1.SystemConcepts.get("inCollection");
        let t = c.getTriplets().find(t => {
            return (t.getVerb().isSame(inCollectionVerb) && t.getTarget().getId() == collection.getSubject().getId());
        });
        c.setUpsert(true);
        await c.addTriplet(inCollectionVerb, collection.getSubject(), [
            await Utils_1.Utils.createDBReference("assetKeyId", assetLinkData.assetKeyId),
            await Utils_1.Utils.createDBReference("baseTokenUrl", assetLinkData.baseTokenUrl),
        ], true, true);
        await contractFactory.pushTriplets();
        await contractFactory.pushRefs();
        console.log("");
    }
    async createNovastarDataFromBinanceMarket() {
        // Get top 100 collection from binance  
        let url = "https://www.binance.com/bapi/nft/v1/friendly/nft/ranking/top-collections-v2/bsc/all/volumeDesc/100";
        let top100Coll = await APIService_1.APIService.get(url);
        let collections = top100Coll.data.data;
        let collIds = collections.map(c => { return c.collectionId; });
        let payload = {
            "amountFrom": "", "amountTo": "", "categories": [], "currency": "",
            "mediaType": [], "tradeType": [], "collections": collIds, "networks": [], "isVerified": [], "assetType": [],
            "rarities": [], "page": 1, "rows": 1, "orderBy": "amount_sort", "orderType": 1, "isBack": "0", "properties": []
        };
        // get assset to get the contracts later 
        for (let i = 0; i < collections.length; i++) {
            url = "https://www.binance.com/bapi/nft/v1/friendly/nft/asset/market/asset-list";
            let res = await APIService_1.APIService.post(url, payload);
            let assetid = res.data.data.rows[0].nftInfoId;
            url = "https://www.binance.com/bapi/nft/v1/friendly/nft/nft-asset/asset-detail?nftInfoId=" + assetid;
            res = await APIService_1.APIService.get(url);
            let assetDetail = res.data.data.nftInfoDetailMgsVo;
            // get asset data 
            // nftInfoDetailMgsVo
            // contractAddress
            // tokenId
            console.log(assetDetail);
            let tokenId = assetDetail.tokenId;
            let contractAddress = assetDetail.contractAddress;
            // Get the first block for this contract 
            url = "https://api.bscscan.com/api?module=account&action=txlist&address=" + "&startblock=0&endblock=99999999&page=1&offset=1&sort=asc&apikey=F4PDD8X9P86J3S1PXHZUGPBTQAR2APVD41";
            let a = await APIService_1.APIService.get(url);
            let fristBlock = a.data.result[0].blockNumber;
            let d = {
                "address": contractAddress.toLowerCase(),
                "startBlock": fristBlock,
                "endBlock": null,
                "lastBlockProcessed": fristBlock - 5,
                "range": 5000,
                "standard": "erc721",
                "active": true,
                "chain": "ethereum",
                "baseTokenUrl": "#TOKEN#",
                "assetKeyId": "#TOKENID#",
                "tokenIdUsedForUri": ""
            };
            // getting base token url 
        }
        console.log("");
    }
    async getCollections() {
        let collectionFactory = new EntityFactory_1.EntityFactory("assetCollection", "assetCollectionFile", await SystemConcepts_1.SystemConcepts.get("collectionId"));
        await collectionFactory.loadEntityConcepts(null, "1");
        await collectionFactory.loadEntityConceptsRefs();
        collectionFactory.getEntities().forEach(e => {
            let json = e.getEntityRefsAsJson();
            console.log(json);
        });
    }
}
exports.Test = Test;
Sandra_1.Sandra.DB_CONFIG = {
    database: "lindt_helvetia",
    host: "mysql-lindt.alwaysdata.net",
    env: "raclette",
    password: "!!Wak4bewq",
    user: "lindt_ranjit"
};
let test = new Test();
test.getCollections();
//# sourceMappingURL=test.js.map