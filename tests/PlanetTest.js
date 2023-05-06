"use strict";
/// This is planet test class, it implements various functions to load and push data
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanetTest = void 0;
const Sandra_1 = require("../src/Sandra");
const Concept_1 = require("../src/models/Concept");
const SystemConcepts_1 = require("../src/models/SystemConcepts");
const Triplet_1 = require("../src/models/Triplet");
const Common_1 = require("../src/utils/Common");
const JSONQuery_1 = require("../src/utils/JSONQuery");
const TemporaryId_1 = require("../src/utils/TemporaryId");
const EntityFactory_1 = require("../src/wrappers/EntityFactory");
/// It can be taken as reference to use this plug in. 
class PlanetTest {
    constructor() {
        this.PLANET_FILE = "planet_file";
        this.PLANET_ISA = "planet";
        this.MOON_FILE = "moon_file";
        this.MOON_ISA = "moon";
        this.DB_CONFIG_LOCAL = {
            name: "sandra",
            database: "jetski",
            host: "localhost",
            env: "fondue",
            password: "",
            user: "root",
            connectionLimit: 10,
            queueLimit: 0,
            waitForConnections: true
        };
        this.APP_CONFIG_LOCAL = {
            IPFSServiceUrl: ""
        };
        Sandra_1.Sandra.DB_CONFIG = [this.DB_CONFIG_LOCAL, Object.assign(Object.assign({}, this.DB_CONFIG_LOCAL), { name: "sandra1" })];
        Sandra_1.Sandra.APP_CONFIG = this.APP_CONFIG_LOCAL;
        Sandra_1.Sandra.LOG_CONFIG = {
            enable: true,
            query: {
                enable: true,
                time: true,
                values: true
            }
        };
    }
    async run() {
        // Load and Push one by one
        await this.push();
        //await this.load("jupiter11");
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
        //await this.selectAsJSON();
        //await this.pushAsJSON();
        //await this.selectAsJSON()
        //await this.pushMultipleBatch();
    }
    async push(server = "sandra") {
        console.log("\n### Push ####");
        let planetFactory = new EntityFactory_1.EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts_1.SystemConcepts.get("name", server));
        let moonFactory = new EntityFactory_1.EntityFactory(this.MOON_ISA, this.MOON_FILE, await SystemConcepts_1.SystemConcepts.get("name", server));
        let ref1 = await Common_1.Common.createDBReference("name", "ranjit111", undefined, server);
        let ref2 = await Common_1.Common.createDBReference("size", "10Km", undefined, server);
        let ref3 = await Common_1.Common.createDBReference("name", "ranjit2111", undefined, server);
        let p = await planetFactory.create([ref1, ref2]);
        let m = await moonFactory.create([ref3]);
        p.join("moon", m);
        p.brother("hasMoon", "true");
        await moonFactory.loadAllSubjects();
        await planetFactory.loadAllSubjects();
        await planetFactory.push();
        console.log("done");
    }
    async load(planetName, server = "sandra") {
        var _a, _b;
        console.log("\n### Loading ####");
        let planetFactory = new EntityFactory_1.EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts_1.SystemConcepts.get("name", server));
        let ref = await Common_1.Common.createDBReference("name", planetName, undefined, server);
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
    async updateRefAndTriplet(server = "sandra") {
        var _a, _b;
        console.log("\n### Updating ####");
        let planetFactory = new EntityFactory_1.EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts_1.SystemConcepts.get("name", server));
        let moonFactory = new EntityFactory_1.EntityFactory(this.MOON_ISA, this.MOON_FILE, await SystemConcepts_1.SystemConcepts.get("name", server));
        let refPlanet = await Common_1.Common.createDBReference("name", "jupiter1", undefined, server);
        await planetFactory.load(refPlanet, true);
        let refMoon = await Common_1.Common.createDBReference("name", "europa1", undefined, server);
        let m = await moonFactory.create([refMoon]);
        await moonFactory.loadAllSubjects();
        await moonFactory.push();
        let e = planetFactory.getEntities()[0];
        // Setting pushed status to false to stop ignoring push
        e.setPushedStatus(false);
        // Set to update or insert references
        e.setUpsert(true);
        let ref1 = e.getRef(await SystemConcepts_1.SystemConcepts.get("size", server));
        // Updating reference
        ref1 === null || ref1 === void 0 ? void 0 : ref1.setValue("10Km");
        // Updating triplet
        e.addTriplet(await SystemConcepts_1.SystemConcepts.get("moon", server), m.getSubject(), [], true, true);
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
    async addNewRefAndTripet(server = "sandra") {
        var _a, _b;
        console.log("\n### Updating ####");
        let planetFactory = new EntityFactory_1.EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts_1.SystemConcepts.get("name", server));
        let moonFactory = new EntityFactory_1.EntityFactory(this.MOON_ISA, this.MOON_FILE, await SystemConcepts_1.SystemConcepts.get("name", server));
        let refPlanet = await Common_1.Common.createDBReference("name", "jupiter1", undefined, server);
        await planetFactory.load(refPlanet, true);
        let refMoon = await Common_1.Common.createDBReference("name", "europa1", undefined, server);
        let m = await moonFactory.create([refMoon]);
        await moonFactory.loadAllSubjects();
        await moonFactory.push();
        let e = planetFactory.getEntities()[0];
        // Setting pushed status to false to stop ignoring push
        e.setPushedStatus(false);
        // To add new ref setting upsert to false 
        e.setUpsert(false);
        let refNew = await Common_1.Common.createDBReference("tilt", "23Deg", undefined, server);
        await e.addRef(refNew);
        // Adding triplet
        e.addTriplet(await SystemConcepts_1.SystemConcepts.get("moon1", server), m.getSubject(), [], true, false);
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
    async pushBatch(batchID, server = "sandra") {
        console.log("\n### Push Batch ####");
        let planetFactory = new EntityFactory_1.EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts_1.SystemConcepts.get("name", server), server);
        let moonFactory = new EntityFactory_1.EntityFactory(this.MOON_ISA, this.MOON_FILE, await SystemConcepts_1.SystemConcepts.get("name", server), server);
        for (let j = 1; j <= 1000; j++) {
            console.log("\n### Creating group ####" + j + ", batch - " + batchID);
            planetFactory.reset();
            moonFactory.reset();
            // Creating entity object array in factory 
            for (let i = 1; i <= 1000; i++) {
                let planetId = "planet" + (j * 1000) + i + batchID;
                let moonId = "moon" + i; //Math.floor(Math.random() * 100);;
                let p = await planetFactory.create([
                    await Common_1.Common.createDBReference("name", planetId, undefined, server),
                    await Common_1.Common.createDBReference("diameter", "10000", undefined, server),
                ]);
                let m = await moonFactory.create([
                    await Common_1.Common.createDBReference("name", moonId, undefined, server),
                    await Common_1.Common.createDBReference("diameter", "10000", undefined, server),
                ]);
                // Brother with reference attached 
                await p.brother("hasMoon", "true", [
                    await Common_1.Common.createDBReference("totalMoon", "1", undefined, server),
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
            console.log("\n### Pushed group ####" + j + ", batch - " + batchID);
        }
    }
    async loadBatch(server = "sandra") {
        console.log("\n### Loading Batch ####");
        let time = Date.now();
        let planetFactory = new EntityFactory_1.EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts_1.SystemConcepts.get("name", server));
        // Creating entity object array in factory 
        for (let i = 0; i < 10; i++) {
            let id = "planet" + i;
            await planetFactory.create([await Common_1.Common.createDBReference("name", id, undefined, server)]);
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
    async loadTopPlanetsWithPaging(limit = 100, server = "sandra") {
        var _a, _b;
        console.log("\n### Loading Top Planets ####");
        let pageIndex = 1;
        let time = Date.now();
        let planetFactory = new EntityFactory_1.EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts_1.SystemConcepts.get("name", server));
        await planetFactory.loadEntityConcepts(undefined, limit.toString());
        await planetFactory.loadTriplets();
        await planetFactory.loadAllTripletRefs();
        console.log("\n#### Page " + pageIndex + " ####  -  " + (Date.now() - time) + "ms");
        await this.printFactory(planetFactory);
        while (((_a = planetFactory.getEntities()) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            await Common_1.Common.wait(1000);
            pageIndex = pageIndex + 1;
            let lastID = (_b = planetFactory.getEntities()[planetFactory.getEntities().length - 1].getSubject()) === null || _b === void 0 ? void 0 : _b.getId();
            let time = Date.now();
            planetFactory.reset();
            await planetFactory.loadEntityConcepts(lastID, limit.toString());
            await planetFactory.loadTriplets();
            await planetFactory.loadAllTripletRefs();
            console.log("\n#### Page " + pageIndex + " ####  -  " + (Date.now() - time) + "ms");
            await this.printFactory(planetFactory);
        }
    }
    async filter(moonName, server = "sandra") {
        var _a, _b;
        console.log("\n### Filter entities with given moon  ####");
        let planetFactory = new EntityFactory_1.EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts_1.SystemConcepts.get("name", server));
        let moonFactory = new EntityFactory_1.EntityFactory(this.MOON_ISA, this.MOON_FILE, await SystemConcepts_1.SystemConcepts.get("name", server));
        await moonFactory.load(await Common_1.Common.createDBReference("name", moonName, undefined, server));
        if (((_a = moonFactory.getEntities()) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            let moon = moonFactory.getEntities()[0];
            console.log("Moon to filter");
            this.print(moon);
            // Creating a temp subject concept for the facotry 
            let subConcept = new Concept_1.Concept(TemporaryId_1.TemporaryId.create(), Concept_1.Concept.ENTITY_CONCEPT_CODE_PREFIX + planetFactory.getIsAVerb(), undefined);
            // Filter all entities with joined moon as moon1 
            let t1 = new Triplet_1.Triplet(TemporaryId_1.TemporaryId.create(), subConcept, await SystemConcepts_1.SystemConcepts.get("moon", server), moon.getSubject());
            planetFactory.abort("from test");
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
            await planetFactory.loadTriplets(undefined, undefined, true);
            await planetFactory.loadAllTripletRefs();
            await this.printFactory(planetFactory);
        }
        else {
            console.log("Moon entity not available to filter");
        }
    }
    async selectAsJSON(server = "sandra") {
        let json = {
            "is_a": "planet",
            "contained_in_file": "planet_file",
            "uniqueRef": "name",
            "refs": {},
            "brothers": {},
            "joined": {},
            "options": {
                "limit": 1000,
                "load_data": true
            }
        };
        let r = await JSONQuery_1.JSONQuery.selectAsJson(json, server);
        console.log(r);
        console.log("");
    }
    async pushAsJSON(server = "sandra") {
        let json = {
            "is_a": "planet",
            "contained_in_file": "planet_file",
            "uniqueRef": "name",
            "refs": {
                "name": "earth!!!",
                "diameter": "100000",
                "atmosphere": "yes",
                "atmosphere1": "yes",
                "atmosphere2": "no"
            },
            "brothers": {
                "hasMoon": {
                    "target": "false",
                    "refs": {
                        "totalMoon": "44"
                    }
                },
                "hasAtmosphere": {
                    "target": "true",
                    "refs": {
                        "breathable": "no"
                    }
                }
            },
            "joined": {
                "moon": {
                    "target": {
                        "is_a": "moon",
                        "contained_in_file": "moon_file",
                        "uniqueRef": "name",
                        "refs": {
                            "name": "moonZZZZ"
                        },
                        "brothers": {},
                        "joined": {},
                        "push": true
                    },
                    "refs": {
                        "atmosphere": "no"
                    }
                },
                "satellite": {
                    "target": {
                        "is_a": "satellite",
                        "contained_in_file": "satellite_file",
                        "uniqueRef": "name",
                        "refs": {
                            "name": "satelliteZZZ"
                        },
                        "brothers": {},
                        "joined": {},
                        "push": false
                    },
                    "refs": {}
                },
                "lifeForms": {
                    "target": {
                        "is_a": "humans",
                        "contained_in_file": "humans_file",
                        "uniqueRef": "name",
                        "refs": {
                            "name": "level1"
                        },
                        "brothers": {},
                        "joined": {},
                        "push": false
                    },
                    "refs": {},
                }
            }
        };
        await JSONQuery_1.JSONQuery.push(json, server);
        console.log("Done!!");
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
        var _a, _b, _c, _d, _e, _f;
        let tabs = this.getTabs(pos);
        if (e) {
            let sub = e.getSubject();
            if (sub && ((_a = sub.getCode()) === null || _a === void 0 ? void 0 : _a.indexOf("system concept")) >= 0)
                return;
            console.log(tabs + "SUBJECT ID:" + ((_b = e.getSubject()) === null || _b === void 0 ? void 0 : _b.getId()));
            console.log(tabs + "References - ");
            let refs = e.getRefs();
            for (let i = 0; i < (refs === null || refs === void 0 ? void 0 : refs.length); i++) {
                let r = refs[i];
                console.log(tabs + "ID:" + r.getId() + "    TRIPLET ID:" + ((_c = r.getTripletLink()) === null || _c === void 0 ? void 0 : _c.getId()) + "    CONCEPT:[" + ((_d = r.getIdConcept()) === null || _d === void 0 ? void 0 : _d.getDBArrayFormat()) + "]" + "   VALUE:[" + r.getValue() + "]");
            }
            console.log(tabs + "Triplets - ");
            let triplets = e.getTriplets();
            for (let i = 0; i < (triplets === null || triplets === void 0 ? void 0 : triplets.length); i++) {
                let t = triplets[i];
                console.log(tabs + "ID:" + t.getId() + "    VERB:[" + ((_e = t.getVerb()) === null || _e === void 0 ? void 0 : _e.getDBArrayFormat()) + "]   TARGET:[" + ((_f = t.getTarget()) === null || _f === void 0 ? void 0 : _f.getDBArrayFormat()) + "]");
                if (t.getJoinedEntity())
                    this.print(t.getJoinedEntity(), pos + 1);
            }
        }
        else {
            console.log("Not found");
        }
    }
    async QueryJSON(json, level = 0, server = "sandra") {
        var _a;
        let limit = 1;
        if (level == 0)
            limit = json.limit;
        let uniqueRefConcept = await SystemConcepts_1.SystemConcepts.get(json["uniqueRef"], server);
        let factory = new EntityFactory_1.EntityFactory(json["is_a"], json["contained_in_file"], uniqueRefConcept);
        let subConcept = new Concept_1.Concept(TemporaryId_1.TemporaryId.create(), Concept_1.Concept.ENTITY_CONCEPT_CODE_PREFIX + factory.getIsAVerb(), undefined);
        let cFile = await SystemConcepts_1.SystemConcepts.get(json["contained_in_file"], server);
        let sysCiF = await SystemConcepts_1.SystemConcepts.get("contained_in_file", server);
        let t2 = new Triplet_1.Triplet(TemporaryId_1.TemporaryId.create(), subConcept, sysCiF, cFile);
        let refsArr = [];
        let refKeys = Object.keys(json.refs);
        for (let i = 0; i < refKeys.length; i++) {
            let ref = await Common_1.Common.createDBReference(refKeys[i], json.refs[refKeys[i]], t2, server);
            refsArr.push(ref);
        }
        let tripletsArr = [t2];
        let tripletsKeys = Object.keys(json.brothers);
        for (let i = 0; i < tripletsKeys.length; i++) {
            tripletsArr.push(new Triplet_1.Triplet(TemporaryId_1.TemporaryId.create(), subConcept, await SystemConcepts_1.SystemConcepts.get(tripletsKeys[i], server), await SystemConcepts_1.SystemConcepts.get(json.brothers[tripletsKeys[i]], server)));
        }
        let joinedKeys = Object.keys(json.joined);
        for (let i = 0; i < (joinedKeys === null || joinedKeys === void 0 ? void 0 : joinedKeys.length); i++) {
            let verbConcept = await SystemConcepts_1.SystemConcepts.get(joinedKeys[i], server);
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
    async pushMultipleBatch() {
        let p = [];
        p.push(this.pushBatch("_B1", "sandra"));
        p.push(this.pushBatch("_B2", "sandra1"));
        await Promise.all(p);
        console.log("");
    }
}
exports.PlanetTest = PlanetTest;
let test = new PlanetTest();
test.run().then(r => { process.exit(); }).catch(e => { console.log(e); process.exit(); });
//# sourceMappingURL=PlanetTest.js.map