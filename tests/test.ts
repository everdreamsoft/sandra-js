import { APIService } from "../src/APIService";
import { Concept } from "../src/Concept";
import { DBAdapter } from "../src/DBAdapter";
import { EntityFactory } from "../src/EntityFactory";
import { IAPIResponse } from "../src/interfaces/IAPIResponse";
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

        for (let i = 0; i < 1; i++) {
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
}


Sandra.DB_CONFIG = {
    database: "ccc8",
    host: "localhost",
    env: "bsc",
    password: "",
    user: "root"
};

let test = new Test();
test.loadPendingEvents();