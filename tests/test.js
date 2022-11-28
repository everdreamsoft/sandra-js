"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Test = void 0;
const DBAdapter_1 = require("../src/DBAdapter");
const EntityFactory_1 = require("../src/EntityFactory");
const SystemConcepts_1 = require("../src/SystemConcepts");
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
        let eventFactory = new EntityFactory_1.EntityFactory("blockchainEvent", "blockchainEventFile", await SystemConcepts_1.SystemConcepts.get("txHash"));
        await eventFactory.load(await Utils_1.Utils.createDBReference("assetStatus", "pending"));
        console.log("loaded...");
    }
    async testDeadlockScenario() {
    }
}
exports.Test = Test;
let test = new Test();
test.loadPendingEvents();
//# sourceMappingURL=test.js.map