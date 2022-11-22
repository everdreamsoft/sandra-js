import { DBAdapter } from "../src/DBAdapter";
import { EntityFactory } from "../src/EntityFactory";
import { Reference } from "../src/Reference";
import { SystemConcepts } from "../src/SystemConcepts";
import { Utils } from "../src/Utils";

export class Test {

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

        for (let i = 0; i < 50000; i++) {
            await planetFactory.create(
                [
                    await Utils.createDBReference("name", "planet" + i),
                ]
            );
        }

        await planetFactory.loadAllSubjects();
        await planetFactory.pushBatch();

        let endTime = Date.now();
        console.log("pushed one batch, time taken - " + ((endTime - startTime) / 1000));


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

}

let test = new Test();
test.testBatchSpeed();