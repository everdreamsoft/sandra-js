"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Test = void 0;
const DBAdapter_1 = require("../src/DBAdapter");
const EntityFactory_1 = require("../src/EntityFactory");
const SystemConcepts_1 = require("../src/SystemConcepts");
const Utils_1 = require("../src/Utils");
class Test {
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
}
exports.Test = Test;
let test = new Test();
test.testEntityPush();
//# sourceMappingURL=test.js.map