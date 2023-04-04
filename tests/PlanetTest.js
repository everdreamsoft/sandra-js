"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanetTest = void 0;
const Concept_1 = require("../src/Concept");
const EntityFactory_1 = require("../src/EntityFactory");
const JSONQuery_1 = require("../src/JSONQuery");
const Sandra_1 = require("../src/Sandra");
const SystemConcepts_1 = require("../src/SystemConcepts");
const TemporaryId_1 = require("../src/TemporaryId");
const Triplet_1 = require("../src/Triplet");
const Utils_1 = require("../src/Utils");
const LogManager_1 = require("../src/loggers/LogManager");
/// This is planet test class, it implements various functions to load and push data
/// It can be taken as reference to use this plug in. 
class PlanetTest {
    constructor() {
        this.PLANET_FILE = "planet_file";
        this.PLANET_ISA = "planet";
        this.MOON_FILE = "moon_file";
        this.MOON_ISA = "moon";
        this.DB_CONFIG_LOCAL = {
            database: "ccc8_batch",
            host: "localhost",
            env: "fondue",
            password: "",
            user: "root",
        };
        this.APP_CONFIG_LOCAL = {
            IPFSServiceUrl: ""
        };
        Sandra_1.Sandra.DB_CONFIG = this.DB_CONFIG_LOCAL;
        Sandra_1.Sandra.APP_CONFIG = this.APP_CONFIG_LOCAL;
    }
    async run() {
        LogManager_1.LogManager.log = false;
        // Load and Push one by one 
        //await this.push();
        //await this.load("planet1");
        //await this.updateRefAndTriplet();
        //await this.addNewRefAndTripet();
        // Load and push batch 
        //await this.loadBatch();
        //await this.pushBatch();
        // Load with paging 
        //await this.loadTopPlanetsWithPaging(100);
        // Using Filters 
        //await this.filter("moon1");
        // Using JSON query 
        //await this.select();
    }
    async push() {
        console.log("\n### Push ####");
        let planetFactory = new EntityFactory_1.EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts_1.SystemConcepts.get("name"));
        let moonFactory = new EntityFactory_1.EntityFactory(this.MOON_ISA, this.MOON_FILE, await SystemConcepts_1.SystemConcepts.get("name"));
        let ref1 = await Utils_1.Utils.createDBReference("name", "jupiter1");
        let ref2 = await Utils_1.Utils.createDBReference("size", "10Km");
        let ref3 = await Utils_1.Utils.createDBReference("name", "europa");
        let p = await planetFactory.create([ref1, ref2]);
        let m = await moonFactory.create([ref3]);
        p.join("moon", m);
        p.brother("hasMoon", "true");
        await moonFactory.loadAllSubjects();
        await planetFactory.loadAllSubjects();
        await planetFactory.push();
    }
    async load(planetName) {
        var _a, _b;
        console.log("\n### Loading ####");
        let planetFactory = new EntityFactory_1.EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts_1.SystemConcepts.get("name"));
        let ref = await Utils_1.Utils.createDBReference("name", planetName);
        // Loading enitity data with given ref 
        await planetFactory.load(ref, true, true, 1);
        console.log("Entities found - " + ((_a = planetFactory.getEntities()) === null || _a === void 0 ? void 0 : _a.length));
        if (((_b = planetFactory.getEntities()) === null || _b === void 0 ? void 0 : _b.length) > 0) {
            await this.print(planetFactory.getEntities()[0]);
        }
        else {
            console.log("Not found");
        }
    }
    async updateRefAndTriplet() {
        var _a, _b;
        console.log("\n### Updating ####");
        let planetFactory = new EntityFactory_1.EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts_1.SystemConcepts.get("name"));
        let moonFactory = new EntityFactory_1.EntityFactory(this.MOON_ISA, this.MOON_FILE, await SystemConcepts_1.SystemConcepts.get("name"));
        let refPlanet = await Utils_1.Utils.createDBReference("name", "jupiter1");
        await planetFactory.load(refPlanet, true);
        let refMoon = await Utils_1.Utils.createDBReference("name", "europa1");
        let m = await moonFactory.create([refMoon]);
        await moonFactory.loadAllSubjects();
        await moonFactory.push();
        let e = planetFactory.getEntities()[0];
        // Setting pushed status to false to stop ignoring push
        e.setPushedStatus(false);
        // Set to update or insert references
        e.setUpsert(true);
        let ref1 = e.getRef(await SystemConcepts_1.SystemConcepts.get("size"));
        // Updating reference
        ref1.setValue("10Km");
        // Updating triplet
        e.addTriplet(await SystemConcepts_1.SystemConcepts.get("moon"), m.getSubject(), [], true, true);
        // Updating 
        await planetFactory.push();
        // Reseting factory to reuse it again to load 
        planetFactory.reset();
        await planetFactory.load(refPlanet, true, true);
        console.log("Entities found - " + ((_a = planetFactory.getEntities()) === null || _a === void 0 ? void 0 : _a.length));
        if (((_b = planetFactory.getEntities()) === null || _b === void 0 ? void 0 : _b.length) > 0) {
            await this.print(planetFactory.getEntities()[0]);
        }
        else {
            console.log("Not found");
        }
    }
    async addNewRefAndTripet() {
        var _a, _b;
        console.log("\n### Updating ####");
        let planetFactory = new EntityFactory_1.EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts_1.SystemConcepts.get("name"));
        let moonFactory = new EntityFactory_1.EntityFactory(this.MOON_ISA, this.MOON_FILE, await SystemConcepts_1.SystemConcepts.get("name"));
        let refPlanet = await Utils_1.Utils.createDBReference("name", "jupiter1");
        await planetFactory.load(refPlanet, true);
        let refMoon = await Utils_1.Utils.createDBReference("name", "europa1");
        let m = await moonFactory.create([refMoon]);
        await moonFactory.loadAllSubjects();
        await moonFactory.push();
        let e = planetFactory.getEntities()[0];
        // Setting pushed status to false to stop ignoring push
        e.setPushedStatus(false);
        // To add new ref setting upsert to false 
        e.setUpsert(false);
        let refNew = await Utils_1.Utils.createDBReference("tilt", "23Deg");
        await e.addRef(refNew);
        // Adding triplet
        e.addTriplet(await SystemConcepts_1.SystemConcepts.get("moon1"), m.getSubject(), [], true, false);
        // Updating 
        await planetFactory.push();
        // Reseting factory to reuse it again to load 
        planetFactory.reset();
        await planetFactory.load(refPlanet, true, true);
        console.log("Entities found - " + ((_a = planetFactory.getEntities()) === null || _a === void 0 ? void 0 : _a.length));
        if (((_b = planetFactory.getEntities()) === null || _b === void 0 ? void 0 : _b.length) > 0) {
            await this.print(planetFactory.getEntities()[0]);
        }
        else {
            console.log("Not found");
        }
    }
    async pushBatch() {
        console.log("\n### Push Batch ####");
        let planetFactory = new EntityFactory_1.EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts_1.SystemConcepts.get("name"));
        let moonFactory = new EntityFactory_1.EntityFactory(this.MOON_ISA, this.MOON_FILE, await SystemConcepts_1.SystemConcepts.get("name"));
        // Creating entity object array in factory 
        for (let i = 0; i < 1000; i++) {
            let planetId = "planet" + i;
            let moonId = "moon" + Math.floor(Math.random() * 100);
            ;
            let p = await planetFactory.create([
                await Utils_1.Utils.createDBReference("name", planetId),
                await Utils_1.Utils.createDBReference("diameter", "10000"),
            ]);
            let m = await moonFactory.create([
                await Utils_1.Utils.createDBReference("name", moonId),
                await Utils_1.Utils.createDBReference("diameter", "10000"),
            ]);
            // Brother with reference attached 
            await p.brother("hasMoon", "true", [
                await Utils_1.Utils.createDBReference("totalMoon", "1"),
            ]);
            // Joined entity 
            await p.join("moon", m);
        }
        // Note: 
        // Order of factory push should from down to up, as moon is joined to planet 
        // so we push moon first then planet
        // Loading moon factory to check if present and push 
        await moonFactory.loadAllSubjects();
        await moonFactory.pushBatch();
        // Loading all subject to check if present and push 
        await planetFactory.loadAllSubjects();
        await planetFactory.pushBatch();
    }
    async loadBatch() {
        console.log("\n### Loading Batch ####");
        let time = Date.now();
        let planetFactory = new EntityFactory_1.EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts_1.SystemConcepts.get("name"));
        // Creating entity object array in factory 
        for (let i = 0; i < 10; i++) {
            let id = "planet" + i;
            await planetFactory.create([await Utils_1.Utils.createDBReference("name", id)]);
        }
        console.log("Memory refs creation - " + (Date.now() - time) + "ms");
        time = Date.now();
        // Loading all subject to check if present
        await planetFactory.loadAllSubjects();
        console.log("Loading subjects  - " + (Date.now() - time) + "ms");
        let entities = planetFactory.getEntities().filter(e => { return e.getPushedStatus(); });
        if ((entities === null || entities === void 0 ? void 0 : entities.length) > 0) {
            console.log("Total: " + entities.length);
            time = Date.now();
            //In case if triplets need to be loaded, use this statement  to load triplets  
            await planetFactory.loadTriplets();
            console.log("Loading triplets  - " + (Date.now() - time) + "ms");
            time = Date.now();
            //In case if triplets refs need to be loaded, use this statement  to load triplets  
            await planetFactory.loadAllTripletRefs();
            console.log("Loading triplets refs  - " + (Date.now() - time) + "ms");
            time = Date.now();
            for (let i = 0; i < (entities === null || entities === void 0 ? void 0 : entities.length); i++) {
                console.log("\n");
                this.print(entities[i]);
            }
        }
        else {
            console.log("Data not found");
        }
    }
    async loadTopPlanetsWithPaging(limit = 100) {
        var _a;
        console.log("\n### Loading Top Planets ####");
        let pageIndex = 1;
        let time = Date.now();
        let planetFactory = new EntityFactory_1.EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts_1.SystemConcepts.get("name"));
        await planetFactory.loadEntityConcepts(null, limit.toString());
        await planetFactory.loadTriplets();
        await planetFactory.loadAllTripletRefs();
        console.log("\n#### Page " + pageIndex + " ####  -  " + (Date.now() - time) + "ms");
        await this.printFactory(planetFactory);
        while (((_a = planetFactory.getEntities()) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            await Utils_1.Utils.wait(1000);
            pageIndex = pageIndex + 1;
            let lastID = planetFactory.getEntities()[planetFactory.getEntities().length - 1].getSubject().getId();
            let time = Date.now();
            planetFactory.reset();
            await planetFactory.loadEntityConcepts(lastID, limit.toString());
            await planetFactory.loadTriplets();
            await planetFactory.loadAllTripletRefs();
            console.log("\n#### Page " + pageIndex + " ####  -  " + (Date.now() - time) + "ms");
            await this.printFactory(planetFactory);
        }
    }
    async filter(moonName) {
        var _a, _b;
        console.log("\n### Filter entities with given moon  ####");
        let planetFactory = new EntityFactory_1.EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts_1.SystemConcepts.get("name"));
        let moonFactory = new EntityFactory_1.EntityFactory(this.MOON_ISA, this.MOON_FILE, await SystemConcepts_1.SystemConcepts.get("name"));
        await moonFactory.load(await Utils_1.Utils.createDBReference("name", moonName));
        if (((_a = moonFactory.getEntities()) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            let moon = moonFactory.getEntities()[0];
            console.log("Moon to filter");
            this.print(moon);
            // Creating a temp subject concept for the facotry 
            let subConcept = new Concept_1.Concept(TemporaryId_1.TemporaryId.create(), Concept_1.Concept.ENTITY_CONCEPT_CODE_PREFIX + planetFactory.getIsAVerb(), null);
            // Filter all entities with joined moon as moon1 
            let t1 = new Triplet_1.Triplet(TemporaryId_1.TemporaryId.create(), subConcept, await SystemConcepts_1.SystemConcepts.get("moon"), moon.getSubject());
            await planetFactory.filter([t1], [], 999);
            // In case you also want to filter on bases of references then use this code
            // NOTE: while creating ref you need to link its triplet alos in filter array if triplets as well.
            /*
            let planetFile = await SystemConcepts.get("planet_file");
            let t2 = new Triplet(
                TemporaryId.create(),
                subConcept,
                await SystemConcepts.get("contained_in_file"),
                planetFile
            );
            // Above triplet is used here to link with reference
            let ref = await Utils.createDBReference("name", "planet975", t2);

            // Loading by filter including the reference
            await planetFactory.filter([t1, t2], [ref], 999);
            */
            console.log("Total - " + ((_b = planetFactory.getEntities()) === null || _b === void 0 ? void 0 : _b.length));
            // Loading other data if required 
            await planetFactory.loadTriplets();
            await planetFactory.loadAllTripletRefs();
            await this.printFactory(planetFactory);
        }
        else {
            console.log("Moon entity not available to filter");
        }
    }
    async select() {
        let json = {
            "is_a": "planet",
            "contained_in_file": "planet_file",
            "uniqueRef": "name",
            "refs": {},
            "brothers": {
                "hasMoon": "true"
            },
            "joined": {
                "moon": {
                    "is_a": "moon",
                    "contained_in_file": "moon_file",
                    "uniqueRef": "name",
                    "refs": {
                        "name": "moon1"
                    },
                    "brothers": {},
                    "joined": {}
                }
            },
            "options": {
                "limit": 1000,
                "load_data": true
            }
        };
        let r = await JSONQuery_1.JSONQuery.select(json);
        console.log("Final out - " + (r === null || r === void 0 ? void 0 : r.length));
    }
    getTabs(n = 0) {
        let s = "";
        while (n > 0) {
            s = s + "   ";
            n--;
        }
        return s;
    }
    async printFactory(factory) {
        let entities = factory.getEntities();
        for (let i = 0; i < entities.length; i++) {
            let e = entities[i];
            console.log("\n");
            await this.print(e);
        }
    }
    async print(e, pos = 0) {
        var _a, _b;
        let tabs = this.getTabs(pos);
        if (e) {
            if (e.getSubject().getCode().indexOf("system concept") >= 0)
                return;
            console.log(tabs + "SUBJECT ID:" + ((_a = e.getSubject()) === null || _a === void 0 ? void 0 : _a.getId()));
            console.log(tabs + "References - ");
            let refs = e.getRefs();
            for (let i = 0; i < (refs === null || refs === void 0 ? void 0 : refs.length); i++) {
                let r = refs[i];
                console.log(tabs + "ID:" + r.getId() + "    TRIPLET ID:" + ((_b = r.getTripletLink()) === null || _b === void 0 ? void 0 : _b.getId()) + "    CONCEPT:[" + r.getIdConcept().getDBArrayFormat() + "]" + "   VALUE:[" + r.getValue() + "]");
            }
            console.log(tabs + "Triplets - ");
            let triplets = e.getTriplets();
            for (let i = 0; i < (triplets === null || triplets === void 0 ? void 0 : triplets.length); i++) {
                let t = triplets[i];
                console.log(tabs + "ID:" + t.getId() + "    VERB:[" + t.getVerb().getDBArrayFormat() + "]   TARGET:[" + t.getTarget().getDBArrayFormat() + "]");
                if (t.getJoinedEntity())
                    this.print(t.getJoinedEntity(), pos + 1);
            }
        }
        else {
            console.log("Not found");
        }
    }
    async QueryJSON(json, level = 0) {
        var _a;
        let limit = 1;
        if (level == 0)
            limit = json.limit;
        let uniqueRefConcept = await SystemConcepts_1.SystemConcepts.get(json["uniqueRef"]);
        let factory = new EntityFactory_1.EntityFactory(json["is_a"], json["contained_in_file"], uniqueRefConcept);
        let subConcept = new Concept_1.Concept(TemporaryId_1.TemporaryId.create(), Concept_1.Concept.ENTITY_CONCEPT_CODE_PREFIX + factory.getIsAVerb(), null);
        let cFile = await SystemConcepts_1.SystemConcepts.get(json["contained_in_file"]);
        let sysCiF = await SystemConcepts_1.SystemConcepts.get("contained_in_file");
        let t2 = new Triplet_1.Triplet(TemporaryId_1.TemporaryId.create(), subConcept, sysCiF, cFile);
        let refsArr = [];
        let refKeys = Object.keys(json.refs);
        for (let i = 0; i < refKeys.length; i++) {
            let ref = await Utils_1.Utils.createDBReference(refKeys[i], json.refs[refKeys[i]], t2);
            refsArr.push(ref);
        }
        let tripletsArr = [t2];
        let tripletsKeys = Object.keys(json.brothers);
        for (let i = 0; i < tripletsKeys.length; i++) {
            tripletsArr.push(new Triplet_1.Triplet(TemporaryId_1.TemporaryId.create(), subConcept, await SystemConcepts_1.SystemConcepts.get(tripletsKeys[i]), await SystemConcepts_1.SystemConcepts.get(json.brothers[tripletsKeys[i]])));
        }
        let joinedKeys = Object.keys(json.joined);
        for (let i = 0; i < (joinedKeys === null || joinedKeys === void 0 ? void 0 : joinedKeys.length); i++) {
            let verbConcept = await SystemConcepts_1.SystemConcepts.get(joinedKeys[i]);
            let targets = await this.QueryJSON(json.joined[joinedKeys[i]], level + 1);
            if ((targets === null || targets === void 0 ? void 0 : targets.length) > 0) {
                tripletsArr.push(new Triplet_1.Triplet(TemporaryId_1.TemporaryId.create(), subConcept, verbConcept, targets[0].getSubject()));
            }
            else {
                return [];
            }
        }
        await factory.filter(tripletsArr, refsArr, limit);
        console.log(level + " count - " + ((_a = factory.getEntities()) === null || _a === void 0 ? void 0 : _a.length));
        await this.printFactory(factory);
        return Promise.resolve(factory.getEntities());
    }
}
exports.PlanetTest = PlanetTest;
let test = new PlanetTest();
test.run().then(r => { process.exit(); }).catch(e => { console.log(e); process.exit(); });
//# sourceMappingURL=PlanetTest.js.map