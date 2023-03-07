import { APIService } from "../src/APIService";
import { Concept } from "../src/Concept";
import { DBAdapter } from "../src/DBAdapter";
import { Entity } from "../src/Entity";
import { EntityFactory } from "../src/EntityFactory";
import { IAPIResponse } from "../src/interfaces/IAPIResponse";
import { Reference } from "../src/Reference";
import { Sandra } from "../src/Sandra";
import { SystemConcepts } from "../src/SystemConcepts";
import { TemporaryId } from "../src/TemporaryId";
import { Triplet } from "../src/Triplet";
import { Utils } from "../src/Utils";

export class Test {

    async testBlockLoad() {

        let blockFactory: EntityFactory = new EntityFactory("blockchainBloc", "blockchainblocFile",
            await SystemConcepts.get("blockIndex"));

        // Load all entity triplets 
        await blockFactory.load(await Utils.createDBReference("ethereum-timestamp", "1"), false, false, 1000);

        await blockFactory.loadAllTripletRefs();

        // Update timestamp
        for (let i = 0; i < blockFactory.getEntities().length; i++) {
            let block = blockFactory.getEntities()[i];
            let blockNumRef = block.getRef(await SystemConcepts.get("blockIndex"));
            let valueRef = block.getRef(await SystemConcepts.get("ethereum-timestamp"));
            valueRef.setValue("2");
        }

        await blockFactory.batchRefUpdate(await SystemConcepts.get("ethereum-timestamp"));

    }
    async testBlocktimeUpdate() {

        console.log("inserting...");

        let startTime = Date.now();

        let blockFactory: EntityFactory = new EntityFactory("blockchainBloc", "blockchainblocFile",
            await SystemConcepts.get("blockIndex"));

        for (let i = 0; i < 50000; i++) {
            let b = await blockFactory.create([
                await Utils.createDBReference("blockIndex", i.toString()),
                await Utils.createDBReference("ethereum-timestamp", "1"),
                await Utils.createDBReference("creationTimestamp", "1"),
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

        console.log("Mem entity time " + memTime)
        console.log("Loading time " + loadTime)
        console.log("Insert time " + insertTime)
        console.log("Total Batch time " + batchTime)


    }

    async testProcessEntity() {

        let processFactory = new EntityFactory("jwiProcess", "jwiProcessFile", await SystemConcepts.get("jwiId"));
        let contractFactory = new EntityFactory("ethContract", "blockchainContractFile", await SystemConcepts.get("id"));

        await processFactory.load(await Utils.createDBReference("jwiId", "evm_jetski_ethereum"));

        // Get all the joined contracts 
        let e = processFactory.getEntities()[0];

        // Joined address subjects
        let trips = e.getTriplets().filter(t => {
            return t.getVerb().getShortname() == "joinedAddress"
        });

        for (let i = 0; i < trips.length; i++) {
            let e = await contractFactory.loadBySubject(trips[i].getTarget());
            contractFactory.getEntities().push(e);
        }

        let contracts = [];

        contractFactory.getEntities().forEach(e => {
            contracts.push(e.getEntityRefsAsJson());
        })


        console.log("");

    }

    async testEntityUpsert() {

        console.log("started test");

        let planetFactory = new EntityFactory("planet", "planet_file", await SystemConcepts.get("name"));

        let p1 = await planetFactory.create(
            [
                await Utils.createDBReference("name", "earth1"),
                await Utils.createDBReference("age", "3.5B"),
                await Utils.createDBReference("atm", "yes")
            ],
            true
        );

        await p1.brother("hasMoon", "no", [], false);

        await planetFactory.loadAllSubjects();
        await planetFactory.push();

        console.log("Done");

        process.exit();

    }

    async testEntityPush() {

        console.log("started test");

        let planetFactory = new EntityFactory("exo_planet", "exo_planet_file", await SystemConcepts.get("name"));
        let moonFactory = new EntityFactory("moon", "moon_file", await SystemConcepts.get("name"));

        await planetFactory.create(
            [
                await Utils.createDBReference("name", "earth1"),
                await Utils.createDBReference("age", "3.5B")
            ]
        );

        await planetFactory.create(
            [
                await Utils.createDBReference("name", "venus1"),
                await Utils.createDBReference("age", "3.5B")
            ]
        );

        let e = await planetFactory.create(
            [
                await Utils.createDBReference("name", "earth1"),
                await Utils.createDBReference("age", "3B"),
                await Utils.createDBReference("atmosphere", "yes"),
                await Utils.createDBReference("pressure", "1"),
                await Utils.createDBReference("habitable", "yes"),
            ]
        );

        await e.brother("hasMoon", "yes");

        let moon1 = await moonFactory.create([await Utils.createDBReference("name", "moon1")]);
        await e.join("moon", moon1);

        await moonFactory.loadAllSubjects();
        await planetFactory.loadAllSubjects();

        await planetFactory.push();

        console.log("Done");

        process.exit();

    }

    async testEnityLoad() {

        let planetFactory = new EntityFactory("exo_planet", "exo_planet_file", await SystemConcepts.get("name"));
        await planetFactory.load(await Utils.createDBReference("name", "earth"));
        console.log("");

    }

    async testEnityLoadAll() {
        let planetFactory = new EntityFactory("exo_planet", "exo_planet_file", await SystemConcepts.get("name"));
        await planetFactory.loadEntityConcepts(null, "2");
        console.log("");
    }

    async testBatchPush() {

        console.log("started test");

        let planetFactory = new EntityFactory("exo_planet", "exo_planet_file", await SystemConcepts.get("name"));
        let moonFactory = new EntityFactory("moon", "moon_file", await SystemConcepts.get("name"));

        await planetFactory.create(
            [
                await Utils.createDBReference("name", "earth1"),
                await Utils.createDBReference("age", "3.5B")
            ]
        );

        await planetFactory.create(
            [
                await Utils.createDBReference("name", "venus1"),
                await Utils.createDBReference("age", "3.5B")
            ]
        );

        let e = await planetFactory.create(
            [
                await Utils.createDBReference("name", "earth1"),
                await Utils.createDBReference("age", "3B"),
                await Utils.createDBReference("atmosphere", "yes"),
                await Utils.createDBReference("pressure", "1"),
                await Utils.createDBReference("habitable", "yes"),
            ]
        );

        await e.brother("hasMoon", "yes");
        await e.brother("hasMoon", "yes");
        await e.brother("hasMoon", "yes");
        await e.brother("hasMoon", "yes");
        await e.brother("hasMoon", "yes",
            [
                await Utils.createDBReference("total", "1"),
                await Utils.createDBReference("test", "2"),
            ]
        );

        await e.brother("hasMoon", "yes",
            [
                await Utils.createDBReference("total", "2"),
                await Utils.createDBReference("test1", "3"),
            ]
        );

        let moon1 = await moonFactory.create([await Utils.createDBReference("name", "moon1")]);
        let moon2 = await moonFactory.create([await Utils.createDBReference("name", "moon2")]);

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

        let planetFactory = new EntityFactory("planet", "planet_file", await SystemConcepts.get("name"));

        for (let i = 0; i < 100; i++) {
            await planetFactory.create(
                [
                    await Utils.createDBReference("name", "planet" + i),
                ]
            );
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


        console.log("Mem entity time " + memTime)
        console.log("Loading time " + loadTime)
        console.log("Insert time " + insertTime)
        console.log("Total Batch time " + batchTime)


    }

    async testMaxIdInsert() {

        try {

            for (let i = 0; i < 1000; i++) {
                (await DBAdapter.getInstance());
                await (await DBAdapter.getInstance()).beginTransaction();
                await (await DBAdapter.getInstance()).lockTables(true);
                let a = await (await DBAdapter.getInstance()).getMaxConceptId();
                //await (await DBAdapter.getInstance()).addConceptWithMaxRange(Number(a) + 10);
                await (await DBAdapter.getInstance()).unlockTable();
                // await (await DBAdapter.getInstance()).sleep(1);
                await (await DBAdapter.getInstance()).commit();
            }

            console.log("complete");

            process.exit();

        }
        catch (e) {
            console.log(e);
            await (await DBAdapter.getInstance()).close();
        }

    }

    async loadPendingEvents() {

        Sandra.APP_CONFIG = {
            IPFSServiceUrl: "https://ipfsc.crystalsuite.com/"
        };
        let res = await APIService.get("ipfs://QmTDcCdt3yb6mZitzWBmQr65AW6Wska295Dg9nbEYpSUDR/2");

        let eventFactory: EntityFactory = new EntityFactory("blockchainEvent", "blockchainEventFile", await SystemConcepts.get("txHash"));
        let contractFactory: EntityFactory = new EntityFactory("ethContract", "blockchainContractFile", await SystemConcepts.get("id"));
        let tokenPathFactory: EntityFactory = new EntityFactory("tokenPath", "tokenPathFile", await SystemConcepts.get("code"));
        let assetFactory: EntityFactory = new EntityFactory("blockchainizableAsset", "blockchainizableAssets", await SystemConcepts.get("assetId"));

        await contractFactory.load(await Utils.createDBReference("id", "0x9227a3d959654c8004fa77dffc380ec40880fff6"), true);

        if (contractFactory.getEntities()?.length == 0) {
            throw new Error("Contract not found");
        }

        let contract = contractFactory.getEntities()[0];

        let subConcept = new Concept(TemporaryId.create(), Concept.ENTITY_CONCEPT_CODE_PREFIX +
            eventFactory.getIsAVerb(), null);

        let t = new Triplet(
            TemporaryId.create(),
            subConcept,
            await SystemConcepts.get("assetStatus"),
            await SystemConcepts.get("pending")
        )
        let t1 = new Triplet(
            TemporaryId.create(),
            subConcept,
            await SystemConcepts.get("onBlockchain"),
            await SystemConcepts.get("ethereum")
        )

        let t2 = new Triplet(
            TemporaryId.create(),
            subConcept,
            await SystemConcepts.get("blockchainContract"),
            contract.getSubject()
        )
        await eventFactory.loadByTriplet([t, t1, t2], 100);
        await eventFactory.loadAllTripletRefs()

        let tokenList = [];

        let assetStatusVerb = await SystemConcepts.get("assetStatus");
        let completedVerb = await SystemConcepts.get("completed");

        // Get tokens 
        for (let i = 0; i < eventFactory.getEntities().length; i++) {
            // Get token from reference with triplet link as t2
            let e = eventFactory.getEntities()[i];
            let tokenRef = e.getRef(await SystemConcepts.get("tokenId"));
            if (tokenRef) {
                tokenList.push(tokenRef.getValue());
            }
            let t = e.getTriplets().find(t => { return t.getVerb().isSame(assetStatusVerb) });
            t.setTarget(completedVerb);
            t.setUpsert(true);
        }

        // Get asset base meta data link for the collection and contract
        await tokenPathFactory.loadAllSubjects();

        let inCollectionVerb = await SystemConcepts.get("inCollection");
        let assetKeyIdConcept = await SystemConcepts.get("assetKeyId");
        let baseTokenVerb = await SystemConcepts.get("baseTokenUrl");
        let codeVerb = await SystemConcepts.get("code");
        let bindToCollVerb = await SystemConcepts.get("bindToCollection")
        // Finding all inCollection triplets 
        let collectionTriplet = contract.getTriplets().filter(t => {
            return t.getVerb().isSame(inCollectionVerb)
        });

        // Get contract triplets for contract/colletion to get tokeuri and assetid 
        for (let i = 0; i < collectionTriplet.length; i++) {

            let t = collectionTriplet[i];

            let assetKeyIdRef = contract.getRefs().find(r => {
                return r.getTripletLink().getId() == t.getId() && r.getIdConcept().isSame(assetKeyIdConcept)
            });

            let baseUrlRef = contract.getRefs().find(r => {
                return r.getTripletLink().getId() == t.getId() && r.getIdConcept().isSame(baseTokenVerb)
            });

            let assetId = assetKeyIdRef?.getValue();
            let baseTokenUrl = baseUrlRef?.getValue();

            for (let j = 0; j < tokenList.length; j++) {
                let tokenId = tokenList[j];
                let assetUrl = baseTokenUrl.replace("#TOKEN#", tokenId);

                let res: IAPIResponse = await APIService.get(assetUrl);
                let assetData: any;

                if (res.data) {
                    assetData = {
                        assetId: assetId.includes("#TOKENID#") ? Utils.getHash(res.data) : res.data[assetId],
                        name: res.data.name || "Not Known",
                        imageUrl: res.data.image || "",
                        description: res.data.description || "",
                        test: res.data.test || "te",
                        metadata: assetUrl
                    }
                }
                else {
                    assetData = {
                        assetId: "NOT_FOUND",
                        name: "Not Found",
                        imageUrl: "",
                        description: "",
                        metadata: ""
                    }
                }

                let asset = await assetFactory.create([
                    await Utils.createDBReference("assetId", assetData.assetId),
                    await Utils.createDBReference("name", assetData.name),
                    await Utils.createDBReference("imgURL", assetData.imageUrl),
                    await Utils.createDBReference("description", assetData.description),
                    await Utils.createDBReference("metaDataURL", assetData.metadata),
                ]);

                await asset.join("bindToContract", contract);
                await asset.addTriplet(bindToCollVerb, t.getTarget());

                let token = await tokenPathFactory.create([
                    await Utils.createDBReference("code", "tokenId" + "-" + tokenId)
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

        let blockFactory: EntityFactory = new EntityFactory("blockchainBloc", "blockchainblocFile", await SystemConcepts.get("blockIndex"));

        for (let i = 0; i < 100; i++) {
            let b = await blockFactory.create([
                await Utils.createDBReference("blockIndex", i.toString()),
                await Utils.createDBReference("ethereum1-timestamp", "1"),
                await Utils.createDBReference("creationTimestamp", "1"),
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

        let eventFactory: EntityFactory = new EntityFactory("blockchainEvent", "blockchainEventFile", await SystemConcepts.get("txHash"));
        await eventFactory.load(await Utils.createDBReference("parentHash", "0xb469cc14a7aa306b1a7cc1481d2e4da8d40e5644be2f70f5fa505584ff28b7c3"), true);

        eventFactory.getEntities()?.forEach(e => {
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

        let collectionFactory: EntityFactory = new EntityFactory("assetCollection", "assetCollectionFile", await SystemConcepts.get("collectionId"));
        let contractFactory: EntityFactory = new EntityFactory("ethContract", "blockchainContractFile", await SystemConcepts.get("id"));

        let collection = await collectionFactory.create([
            await Utils.createDBReference("collectionId", assetLinkData.collection),
        ]);

        let c = await contractFactory.create(
            [
                await Utils.createDBReference("id", assetLinkData.contract),
            ]
        );

        await collectionFactory.loadAllSubjects();
        await contractFactory.loadAllSubjects();

        await contractFactory.loadTriplets();
        await contractFactory.loadAllTripletRefs();

        let inCollectionVerb = await SystemConcepts.get("inCollection")

        let t = c.getTriplets().find(t => {
            return (t.getVerb().isSame(inCollectionVerb) && t.getTarget().getId() == collection.getSubject().getId())
        });

        c.setUpsert(true);

        await c.addTriplet(inCollectionVerb, collection.getSubject(), [
            await Utils.createDBReference("assetKeyId", assetLinkData.assetKeyId),
            await Utils.createDBReference("baseTokenUrl", assetLinkData.baseTokenUrl),
        ], true, true);

        await contractFactory.pushTriplets();
        await contractFactory.pushRefs();

        console.log("");

    }

    async createNovastarDataFromBinanceMarket() {

        // Get top 100 collection from binance  

        let url = "https://www.binance.com/bapi/nft/v1/friendly/nft/ranking/top-collections-v2/bsc/all/volumeDesc/100";

        let top100Coll = await APIService.get(url);

        let collections = top100Coll.data.data;


        let collIds = collections.map(c => { return c.collectionId });

        let payload = {
            "amountFrom": "", "amountTo": "", "categories": [], "currency": "",
            "mediaType": [], "tradeType": [], "collections": collIds, "networks": [], "isVerified": [], "assetType": [],
            "rarities": [], "page": 1, "rows": 1, "orderBy": "amount_sort", "orderType": 1, "isBack": "0", "properties": []
        };
        // get assset to get the contracts later 

        for (let i = 0; i < collections.length; i++) {

            url = "https://www.binance.com/bapi/nft/v1/friendly/nft/asset/market/asset-list";
            let res = await APIService.post(url, payload);

            let assetid = res.data.data.rows[0].nftInfoId;

            url = "https://www.binance.com/bapi/nft/v1/friendly/nft/nft-asset/asset-detail?nftInfoId=" + assetid

            res = await APIService.get(url)

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

            let a = await APIService.get(url);

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
            }

            // getting base token url 



        }


        console.log("");


    }

    async getCollections() {
        let collectionFactory: EntityFactory = new EntityFactory("assetCollection", "assetCollectionFile", await SystemConcepts.get("collectionId"));
        await collectionFactory.loadEntityConcepts(null, "1");
        await collectionFactory.loadEntityConceptsRefs();

        collectionFactory.getEntities().forEach(e => {
            let json = e.getEntityRefsAsJson();
            console.log(json);
        });

    }

    async getEvents(limit: number = 1000) {

        let eventFactory: EntityFactory = new EntityFactory("blockchainEvent", "blockchainEventFile", await SystemConcepts.get("txHash"));
        let contractFactory: EntityFactory = new EntityFactory("blockchainContract", "blockchainContractFile", await SystemConcepts.get("id"));
        let blockFactory: EntityFactory = new EntityFactory("blockchainBloc", "blockchainBlocFile", await SystemConcepts.get("id"));
        let addressFactory: EntityFactory = new EntityFactory("blockchainAddress", "blockchainAddressFile", await SystemConcepts.get("address"));

        await contractFactory.load(await Utils.createDBReference("id", "0x1ddb2c0897daf18632662e71fdd2dbdc0eb3a9ec"), true);

        if (contractFactory.getEntities()?.length == 0) {
            throw new Error("Contract not found");
        }

        let contract = contractFactory.getEntities()[0];

        let subConcept = new Concept(TemporaryId.create(), Concept.ENTITY_CONCEPT_CODE_PREFIX +
            eventFactory.getIsAVerb(), null);

        let sourceConcept = await SystemConcepts.get("source");
        let chainConcept = await SystemConcepts.get("onBlockchain");
        let destinationConcept = await SystemConcepts.get("hasSingleDestination");
        let onBlockConcept = await SystemConcepts.get("onBlock");

        let t1 = new Triplet(
            TemporaryId.create(),
            subConcept,
            await SystemConcepts.get("blockchainContract"),
            contract.getSubject()
        );

        let t2 = new Triplet(
            TemporaryId.create(),
            subConcept,
            await SystemConcepts.get("contained_in_file"),
            await SystemConcepts.get(eventFactory.getContainedInFileVerb())
        );

        await eventFactory.loadByTriplet([t2], limit);
        await eventFactory.loadTriplets()
        await eventFactory.loadAllTripletRefs()

        let events = [];
        let tokens = [];

        for (let i = 0; i < eventFactory.getEntities()?.length; i++) {
            let e = eventFactory.getEntities()[i];
            let json: any = e.getEntityRefsAsJson();

            let chainTriplet = e.getTriplets().find(t => t.getVerb().isSame(chainConcept));
            json.blockchain = chainTriplet.getTarget()?.getShortname();

            let destinationTriplet = e.getTriplets().find(t => t.getVerb().isSame(destinationConcept));
            let sourceTriplet = e.getTriplets().find(t => t.getVerb().isSame(sourceConcept));
            let onBlockTriplet = e.getTriplets().find(t => t.getVerb().isSame(onBlockConcept));

            let a = await addressFactory.loadBySubject(sourceTriplet.getTarget());
            let b = await addressFactory.loadBySubject(destinationTriplet.getTarget());
            let c = await blockFactory.loadBySubject(onBlockTriplet.getTarget());

            json.token = e.getRef(await SystemConcepts.get("tokenId"))?.getValue();
            json.orbs = [];
            json.from = a.getRefValByShortname("address");
            json.destination = b.getRefValByShortname("address");
            json.timestamp = c.getRefValByShortname(json.blockchain + "-timestamp");
            json.blockHeight = c.getRefValByShortname("blockIndex");

            tokens.push(json.token);
            events.push(json);

        }

        let orbs = await this.getOrbs(tokens, contract);

        events.forEach(e => {
            orbs["tokenId-" + e.token].forEach(o => {
                e.orbs.push({ "asset": { "imgURL": o } });
            })
        });

        console.log(events);

        return events;

    }

    async getOrbs(tokens: any[], contract: Entity) {

        if (tokens?.length == 0) return [];

        let res = [];

        let tokenPathFactory = new EntityFactory("tokenPath", "tokenPathFile", await SystemConcepts.get("code"));
        let assetFactory: EntityFactory = new EntityFactory("blockchainizableAsset", "blockchainizableAssets", await SystemConcepts.get("assetId"));

        for (let i = 0; i < tokens.length; i++) {
            await tokenPathFactory.create([await Utils.createDBReference("code", "tokenId-" + tokens[i])]);
        }

        await tokenPathFactory.loadAllSubjects();
        await tokenPathFactory.loadTripletsWithVerb(contract.getSubject());

        for (let i = 0; i < tokenPathFactory.getEntities()?.length; i++) {

            let e = tokenPathFactory.getEntities()[i];
            let ts = e.getTriplets().filter(t => { return t.getVerb().getId() == contract.getSubject().getId() });
            res[e.getRefValByShortname("code")] = [];

            for (let j = 0; j < ts?.length; j++) {
                let t = ts[j];
                let a = await assetFactory.loadBySubject(t.getTarget());
                res[e.getRefValByShortname("code")].push(a.getRefValByShortname("imgURL"));
            }

        }

        return res;

    }

    async addProcess(chain: string) {

        let processFactory = new EntityFactory("jwiProcess", "jwiProcessFile", await SystemConcepts.get("id"));

        let p = await processFactory.create([
            await Utils.createDBReference("id", "jetski_" + chain.toLowerCase()),
            await Utils.createDBReference("title", "jetski_title_1" + chain.toLowerCase()),
            await Utils.createDBReference("desc", "jetski_desc_2" + chain.toLowerCase()),
            await Utils.createDBReference("lastStopTime", "" + chain.toLowerCase()),
            await Utils.createDBReference("lastStartTime", "" + chain.toLowerCase()),

        ], true);

        await p.brother("onBlockchain", chain?.toLowerCase(), [], true);
        await p.brother("status", "stop", [], true);

        await processFactory.loadAllSubjects();
        await processFactory.push();

    }

    async joinAddressWithProcess(address, chain) {

        let jwiAddressFactory = new EntityFactory("jwiAddress", "jwiAddressFile", await SystemConcepts.get("id"));
        let processFactory = new EntityFactory("jwiProcess", "jwiProcessFile", await SystemConcepts.get("id"));

        let a = await jwiAddressFactory.create([
            await Utils.createDBReference("id", address.toLowerCase()),
        ]);

        let p = await processFactory.create([
            await Utils.createDBReference("id", "jetski_" + chain.toLowerCase()),
        ]);

        await p.join("joinedAddress", a);

        await jwiAddressFactory.loadAllSubjects();
        await processFactory.loadAllSubjects();
        await processFactory.pushTriplets();

    }

    async addProcessAddress(address: string) {

        let jwiAddressFactory = new EntityFactory("jwiAddress", "jwiAddressFile", await SystemConcepts.get("id"));

        let a = await jwiAddressFactory.create([
            await Utils.createDBReference("id", address.toLowerCase()),
            await Utils.createDBReference("blockRange", address.toLowerCase()),
            await Utils.createDBReference("status", address.toLowerCase()),
            await Utils.createDBReference("lastBlockProcessed", address.toLowerCase()),
            await Utils.createDBReference("lastBlockSaved", address.toLowerCase()),
            await Utils.createDBReference("lastUpdateTime", address.toLowerCase()),
            await Utils.createDBReference("startBlock", address.toLowerCase()),
            await Utils.createDBReference("endBlock", address.toLowerCase()),
            await Utils.createDBReference("standard", address.toLowerCase())
        ], true);

        await jwiAddressFactory.loadAllSubjects();
        await jwiAddressFactory.push();

    }

    async getProcess(chain: string) {
        let processFactory = new EntityFactory("jwiProcess", "jwiProcessFile", await SystemConcepts.get("id"));
        await processFactory.load(await Utils.createDBReference("id", "jetski_" + chain.toLowerCase()), true, true)
        let res = [];

        processFactory.getEntities()?.forEach(p => {
            let values = p.getEntityRefsAsJson();
            p.getTriplets()?.forEach(t => {
                values[t.getVerb().getShortname()] = t.getTarget().getShortname()
            });

            values["appName"] = "EVM Jetski";
            values["blockchain"] = values["onBlockchain"];
            values["processDescription"] = values["desc"];
            values["processID"] = "";
            values["processTitle"] = values["title"];

            res.push(values);
        });

        console.log(res);

    }

    async getActiveBlockchains() {
        let activeBlockchainFactory = new EntityFactory("activeBlockchain", "activeBlockchainFile", await SystemConcepts.get("blockchain"));
        await activeBlockchainFactory.load(null, true);
        console.log("");
    }

    async getContractProcess1(id: string) {
        let processFactory = new EntityFactory("jwiProcess", "jwiProcessFile", await SystemConcepts.get("id"));
        await processFactory.load(await Utils.createDBReference("id", id), true, true)
        console.log("");
    }

    async getContractProcess(address: string) {

        let process: any = {};

        let processFactory = new EntityFactory("jwiProcess", "jwiProcessFile", await SystemConcepts.get("id"));
        let jwiAddressFactory = new EntityFactory("jwiAddress", "jwiAddressFile", await SystemConcepts.get("id"));

        await jwiAddressFactory.load(await Utils.createDBReference("id", address), true);

        if (jwiAddressFactory.getEntities()?.length == 0)
            return process;

        let subConcept = new Concept(TemporaryId.create(), Concept.ENTITY_CONCEPT_CODE_PREFIX +
            processFactory.getIsAVerb(), null);
        let joinedAddressConcept = await SystemConcepts.get("joinedAddress");

        let targetCon = jwiAddressFactory.getEntities()[0].getSubject();


        let t = new Triplet(TemporaryId.create(), subConcept, joinedAddressConcept, targetCon);
        let t2 = new Triplet(
            TemporaryId.create(),
            subConcept,
            await SystemConcepts.get("contained_in_file"),
            await SystemConcepts.get(processFactory.getContainedInFileVerb())
        );
        // Loading by filter 
        await processFactory.loadByTriplet([t, t2], 1);
        await processFactory.loadAllTripletRefs();

        let e: Entity = processFactory.getEntities()[0];

        let a = e.getEntityRefsAsJson();

        return;


    }

    async getOwner() {

        let contractAddress = "0x9227a3d959654c8004fa77dffc380ec40880fff6";
        let tokenId = "1";

        let eventFactory: EntityFactory = new EntityFactory("blockchainEvent", "blockchainEventFile", await SystemConcepts.get("txHash"));
        let contractFactory: EntityFactory = new EntityFactory("blockchainContract", "blockchainContractFile", await SystemConcepts.get("id"));

        await contractFactory.load(await Utils.createDBReference("id", contractAddress), true);

        if (contractFactory.getEntities()?.length == 0) {
            throw new Error("Contract not found");
        }

        let blockchainEventFileConcpet = await SystemConcepts.get("blockchainEventFile");
        let cifConcpet = await SystemConcepts.get("contained_in_file");
        let contractFileConcept = await SystemConcepts.get("blockchainContract");
        let quantityConcept = await SystemConcepts.get("quantity");
        let tokenIdConcept = await SystemConcepts.get("tokenId");

        let contract = contractFactory.getEntities()[0];

        let subConcept = new Concept(TemporaryId.create(), Concept.ENTITY_CONCEPT_CODE_PREFIX +
            eventFactory.getIsAVerb(), null);

        let t1 = new Triplet(
            TemporaryId.create(),
            subConcept,
            cifConcpet,
            blockchainEventFileConcpet
        );

        let t2 = new Triplet(
            TemporaryId.create(),
            subConcept,
            contractFileConcept,
            contract.getSubject()
        );

        let r1 = new Reference("", quantityConcept, t1, "");
        let r2 = new Reference("", tokenIdConcept, t2, tokenId);

        await eventFactory.filter([t1, t2], [r1, r2], 100);

        console.log("");

        await eventFactory.loadTriplets();

        console.log("");


    }


}

const LOCAL = true;

const DB_CONFIG = {
    database: "lindt_helvetia",
    host: "mysql-lindt.alwaysdata.net",
    env: "raclette",
    password: "!!Wak4bewq",
    user: "lindt_ranjit"
};

const DB_CONFIG_LOCAL = {
    database: "ccc8_batch",
    host: "localhost",
    env: "fondue",
    password: "",
    user: "root"
};

Sandra.DB_CONFIG = LOCAL ? DB_CONFIG_LOCAL : DB_CONFIG;

let test = new Test();

test.getOwner();
