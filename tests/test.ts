import { Concept } from "../src/Concept";
import { DBAdapter } from "../src/DBAdapter";
import { EntityFactory } from "../src/EntityFactory";
import { Reference } from "../src/Reference";
import { SystemConcepts } from "../src/SystemConcepts";
import { Triplet } from "../src/Triplet";
import { Utils } from "../src/Utils";

export class Test {

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
test.testBatchPush();