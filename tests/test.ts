import { Concept } from "../src/Concept";
import { EntityFactory } from "../src/EntityFactory";
import { Reference } from "../src/Reference";
import { SystemConcepts } from "../src/SystemConcepts";
import { Triplet } from "../src/Triplet";
import { Utils } from "../src/Utils";

export class Test {

    async testEntity() {

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

        let res = await planetFactory.push();

        console.log("Done");

        process.exit();

    }

}

let test = new Test();
test.testEntity();