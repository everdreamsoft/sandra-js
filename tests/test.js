"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Test = void 0;
const EntityFactory_1 = require("../src/EntityFactory");
const SystemConcepts_1 = require("../src/SystemConcepts");
const Utils_1 = require("../src/Utils");
class Test {
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
        let planetFactory = new EntityFactory_1.EntityFactory("exo_planet", "exo_planet_file", await SystemConcepts_1.SystemConcepts.get("name"));
        // Creating new entities 
        await planetFactory.create([]);
        await planetFactory.create([]);
        await planetFactory.create([]);
        await planetFactory.create([]);
        await planetFactory.create([]);
        await planetFactory.create([]);
        await planetFactory.pushBatch();
    }
    async testJetskiEventsPush() {
    }
}
exports.Test = Test;
let test = new Test();
test.testEntityPush();
//# sourceMappingURL=test.js.map