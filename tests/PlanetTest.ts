import { Concept } from "../src/Concept";
import { Entity } from "../src/Entity";
import { EntityFactory } from "../src/EntityFactory";
import { JSONQuery } from "../src/JSONQuery";
import { Sandra } from "../src/Sandra";
import { SystemConcepts } from "../src/SystemConcepts";
import { TemporaryId } from "../src/TemporaryId";
import { Triplet } from "../src/Triplet";
import { Utils } from "../src/Utils";
import { LogManager } from "../src/loggers/LogManager";

/// This is planet test class, it implements various functions to load and push data
/// It can be taken as reference to use this plug in. 
export class PlanetTest {

    readonly PLANET_FILE = "planet_file";
    readonly PLANET_ISA = "planet";

    readonly MOON_FILE = "moon_file";
    readonly MOON_ISA = "moon";

    readonly DB_CONFIG_LOCAL = {
        database: "ccc8_batch",
        host: "localhost",
        env: "fondue",
        password: "",
        user: "root",
    };

    readonly APP_CONFIG_LOCAL = {
        IPFSServiceUrl: ""
    };

    constructor() {
        Sandra.DB_CONFIG = this.DB_CONFIG_LOCAL;
        Sandra.APP_CONFIG = this.APP_CONFIG_LOCAL;
        Sandra.LOG_CONFIG = {
            main: true,
            query: true,
            queryTime: true
        };
    }

    async run() {

        // Load and Push one by one
        //await this.push();
        //await this.load("planetE");
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
        await this.selectAsJSON();
        //await this.pushAsJSON();

    }

    async push() {

        console.log("\n### Push ####");

        let planetFactory = new EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts.get("name"));
        let moonFactory = new EntityFactory(this.MOON_ISA, this.MOON_FILE, await SystemConcepts.get("name"));

        let ref1 = await Utils.createDBReference("name", "jupiter1");
        let ref2 = await Utils.createDBReference("size", "10Km");
        let ref3 = await Utils.createDBReference("name", "europa");

        let p = await planetFactory.create([ref1, ref2]);
        let m = await moonFactory.create([ref3]);

        p.join("moon", m);
        p.brother("hasMoon", "true");

        await moonFactory.loadAllSubjects();
        await planetFactory.loadAllSubjects();

        await planetFactory.push();

    }

    async load(planetName: string) {

        console.log("\n### Loading ####");

        let planetFactory = new EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts.get("name"));
        let ref = await Utils.createDBReference("name", planetName);

        // Loading enitity data with given ref 
        await planetFactory.load(ref, true, true, 1);

        console.log("Entities found - " + planetFactory.getEntities()?.length);
        if (planetFactory.getEntities()?.length > 0) {
            await this.print(planetFactory.getEntities()[0]);
        }
        else {
            console.log("Not found");
        }

    }

    async updateRefAndTriplet() {

        console.log("\n### Updating ####");

        let planetFactory = new EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts.get("name"));
        let moonFactory = new EntityFactory(this.MOON_ISA, this.MOON_FILE, await SystemConcepts.get("name"));

        let refPlanet = await Utils.createDBReference("name", "jupiter1");
        await planetFactory.load(refPlanet, true);

        let refMoon = await Utils.createDBReference("name", "europa1");
        let m = await moonFactory.create([refMoon]);

        await moonFactory.loadAllSubjects();
        await moonFactory.push();

        let e = planetFactory.getEntities()[0];

        // Setting pushed status to false to stop ignoring push
        e.setPushedStatus(false);
        // Set to update or insert references
        e.setUpsert(true);

        let ref1 = e.getRef(await SystemConcepts.get("size"));

        // Updating reference
        ref1.setValue("10Km");

        // Updating triplet
        e.addTriplet(await SystemConcepts.get("moon"), m.getSubject(), [], true, true);

        // Updating 
        await planetFactory.push();

        // Reseting factory to reuse it again to load 
        planetFactory.reset();
        await planetFactory.load(refPlanet, true, true);

        console.log("Entities found - " + planetFactory.getEntities()?.length);
        if (planetFactory.getEntities()?.length > 0) {
            await this.print(planetFactory.getEntities()[0]);
        }
        else {
            console.log("Not found");
        }
    }

    async addNewRefAndTripet() {

        console.log("\n### Updating ####");

        let planetFactory = new EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts.get("name"));
        let moonFactory = new EntityFactory(this.MOON_ISA, this.MOON_FILE, await SystemConcepts.get("name"));

        let refPlanet = await Utils.createDBReference("name", "jupiter1");
        await planetFactory.load(refPlanet, true);

        let refMoon = await Utils.createDBReference("name", "europa1");
        let m = await moonFactory.create([refMoon]);

        await moonFactory.loadAllSubjects();
        await moonFactory.push();

        let e = planetFactory.getEntities()[0];

        // Setting pushed status to false to stop ignoring push
        e.setPushedStatus(false);

        // To add new ref setting upsert to false 
        e.setUpsert(false);

        let refNew = await Utils.createDBReference("tilt", "23Deg");
        await e.addRef(refNew);

        // Adding triplet
        e.addTriplet(await SystemConcepts.get("moon1"), m.getSubject(), [], true, false);

        // Updating 
        await planetFactory.push();

        // Reseting factory to reuse it again to load 
        planetFactory.reset();
        await planetFactory.load(refPlanet, true, true);

        console.log("Entities found - " + planetFactory.getEntities()?.length);
        if (planetFactory.getEntities()?.length > 0) {
            await this.print(planetFactory.getEntities()[0]);
        }
        else {
            console.log("Not found");
        }
    }

    async pushBatch() {

        console.log("\n### Push Batch ####");

        let planetFactory = new EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts.get("name"));
        let moonFactory = new EntityFactory(this.MOON_ISA, this.MOON_FILE, await SystemConcepts.get("name"));

        // Creating entity object array in factory 
        for (let i = 0; i < 1000; i++) {

            let planetId = "planet" + i;
            let moonId = "moon" + Math.floor(Math.random() * 100);;

            let p = await planetFactory.create(
                [
                    await Utils.createDBReference("name", planetId),
                    await Utils.createDBReference("diameter", "10000"),
                ]
            );

            let m = await moonFactory.create(
                [
                    await Utils.createDBReference("name", moonId),
                    await Utils.createDBReference("diameter", "10000"),
                ]
            );

            // Brother with reference attached 
            await p.brother("hasMoon", "true", [
                await Utils.createDBReference("totalMoon", "1"),
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
        let planetFactory = new EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts.get("name"));

        // Creating entity object array in factory 
        for (let i = 0; i < 10; i++) {
            let id = "planet" + i;
            await planetFactory.create([await Utils.createDBReference("name", id)]);
        }

        console.log("Memory refs creation - " + (Date.now() - time) + "ms");
        time = Date.now();

        // Loading all subject to check if present
        await planetFactory.loadAllSubjects();

        console.log("Loading subjects  - " + (Date.now() - time) + "ms");

        let entities = planetFactory.getEntities().filter(e => { return e.getPushedStatus() });

        if (entities?.length > 0) {

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

            for (let i = 0; i < entities?.length; i++) {
                console.log("\n");
                this.print(entities[i]);
            }

        }
        else {
            console.log("Data not found");
        }

    }

    async loadTopPlanetsWithPaging(limit: number = 100) {

        console.log("\n### Loading Top Planets ####");
        let pageIndex = 1;
        let time = Date.now();
        let planetFactory = new EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts.get("name"));

        await planetFactory.loadEntityConcepts(null, limit.toString());
        await planetFactory.loadTriplets();
        await planetFactory.loadAllTripletRefs();

        console.log("\n#### Page " + pageIndex + " ####  -  " + (Date.now() - time) + "ms");
        await this.printFactory(planetFactory);

        while (planetFactory.getEntities()?.length > 0) {
            await Utils.wait(1000);
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

    async filter(moonName: string) {

        console.log("\n### Filter entities with given moon  ####");
        let planetFactory = new EntityFactory(this.PLANET_ISA, this.PLANET_FILE, await SystemConcepts.get("name"));
        let moonFactory = new EntityFactory(this.MOON_ISA, this.MOON_FILE, await SystemConcepts.get("name"));

        await moonFactory.load(await Utils.createDBReference("name", moonName));

        if (moonFactory.getEntities()?.length > 0) {

            let moon = moonFactory.getEntities()[0];

            console.log("Moon to filter");
            this.print(moon);

            // Creating a temp subject concept for the facotry 
            let subConcept = new Concept(TemporaryId.create(), Concept.ENTITY_CONCEPT_CODE_PREFIX + planetFactory.getIsAVerb(), null);

            // Filter all entities with joined moon as moon1 
            let t1 = new Triplet(
                TemporaryId.create(),
                subConcept,
                await SystemConcepts.get("moon"),
                moon.getSubject()
            );

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

            console.log("Total - " + planetFactory.getEntities()?.length);

            // Loading other data if required 
            await planetFactory.loadTriplets(true);
            await planetFactory.loadAllTripletRefs();

            await this.printFactory(planetFactory);

        }
        else {
            console.log("Moon entity not available to filter");
        }

    }

    async selectAsJSON() {

        let json = {
            "is_a": "blockchainEvent",
            "contained_in_file": "blockchainEventFile",
            "uniqueRef": "txHash",
            "refs": {},
            "brothers": {
                "onBlockchain": {
                    "target": "binance",
                    "refs": {}
                }
            },
            "joined": {
                "blockchainContract": {
                    "target": {
                        "is_a": "bscContract",
                        "contained_in_file": "blockchainContractFile",
                        "uniqueRef": "id",
                        "refs": {
                            "id": "0x198d33fb8f75ac6a7cb968962c743f09c486cca6"
                        },
                        "brothers": {},
                        "joined": {},
                        "options": {
                            "load_data": true
                        }
                    },
                    "refs": {
                        "tokenId": "5008"
                    }
                }
            },
            "options": {
                "limit": 10,
                "load_data": true
            }
        }

        let r = await JSONQuery.selectAsJson(json);

        console.log(r);

        console.log("");

    }

    async pushAsJSON() {

        let json = {
            "is_a": "planet",
            "contained_in_file": "planet_file",
            "uniqueRef": "name",
            "refs": {
                "name": "planetXXXXXXX",
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
                        "brothers": {
                        },
                        "joined": {
                        },
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
                        "brothers": {
                        },
                        "joined": {
                        },
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
                        "brothers": {
                        },
                        "joined": {
                        },
                        "push": false
                    },
                    "refs": {},
                }
            }
        };

        await JSONQuery.push(json);

        console.log("Done!!");

    }

    getTabs(n: number = 0) {
        let s = "";
        while (n > 0) {
            s = s + "   ";
            n--;
        }
        return s;
    }

    async printFactory(factory: EntityFactory) {
        let entities = factory.getEntities();
        for (let i = 0; i < entities.length; i++) {
            let e = entities[i];
            console.log("\n");
            await this.print(e);
        }
    }

    async print(e: Entity, pos: number = 0) {

        let tabs = this.getTabs(pos);

        if (e) {

            if (e.getSubject().getCode().indexOf("system concept") >= 0)
                return;

            console.log(tabs + "SUBJECT ID:" + e.getSubject()?.getId());
            console.log(tabs + "References - ")
            let refs = e.getRefs();
            for (let i = 0; i < refs?.length; i++) {
                let r = refs[i];
                console.log(tabs + "ID:" + r.getId() + "    TRIPLET ID:" + r.getTripletLink()?.getId() + "    CONCEPT:[" + r.getIdConcept().getDBArrayFormat() + "]" + "   VALUE:[" + r.getValue() + "]");
            }

            console.log(tabs + "Triplets - ")
            let triplets = e.getTriplets();

            for (let i = 0; i < triplets?.length; i++) {
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

    async QueryJSON(json: any, level: number = 0): Promise<Entity[]> {

        let limit = 1;
        if (level == 0) limit = json.limit;

        let uniqueRefConcept = await SystemConcepts.get(json["uniqueRef"]);
        let factory = new EntityFactory(json["is_a"], json["contained_in_file"], uniqueRefConcept);

        let subConcept = new Concept(TemporaryId.create(), Concept.ENTITY_CONCEPT_CODE_PREFIX + factory.getIsAVerb(), null);

        let cFile = await SystemConcepts.get(json["contained_in_file"]);
        let sysCiF = await SystemConcepts.get("contained_in_file");
        let t2 = new Triplet(TemporaryId.create(), subConcept, sysCiF, cFile);

        let refsArr = [];
        let refKeys = Object.keys(json.refs);
        for (let i = 0; i < refKeys.length; i++) {
            let ref = await Utils.createDBReference(refKeys[i], json.refs[refKeys[i]], t2);
            refsArr.push(ref);
        }

        let tripletsArr = [t2];
        let tripletsKeys = Object.keys(json.brothers);
        for (let i = 0; i < tripletsKeys.length; i++) {
            tripletsArr.push(new Triplet(
                TemporaryId.create(),
                subConcept,
                await SystemConcepts.get(tripletsKeys[i]),
                await SystemConcepts.get(json.brothers[tripletsKeys[i]])
            ));
        }

        let joinedKeys = Object.keys(json.joined);
        for (let i = 0; i < joinedKeys?.length; i++) {
            let verbConcept = await SystemConcepts.get(joinedKeys[i]);
            let targets = await this.QueryJSON(json.joined[joinedKeys[i]], level + 1);
            if (targets?.length > 0) {
                tripletsArr.push(new Triplet(TemporaryId.create(), subConcept, verbConcept, targets[0].getSubject()));
            }
            else {
                return [];
            }
        }

        await factory.filter(tripletsArr, refsArr, limit);

        console.log(level + " count - " + factory.getEntities()?.length);

        await this.printFactory(factory);

        return Promise.resolve(factory.getEntities());

    }


}

let test = new PlanetTest();
test.run().then(r => { process.exit(); }).catch(e => { console.log(e); process.exit(); });
