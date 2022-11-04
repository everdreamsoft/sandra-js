import { Concept } from "../src/Concept";
import { Entity } from "../src/Entity";
import { EntityFactory } from "../src/EntityFactory";
import { Reference } from "../src/Reference";
import { SystemConcepts } from "../src/SystemConcepts";
import { Utils } from "../src/Utils";

export class Test {

    async testEntity() {

        console.log("started test");

        let factory = new EntityFactory("planet", "planet_file", await SystemConcepts.get("name"));

        await factory.create(
            [
                await Utils.createDBReference("name", "earth"),
                await Utils.createDBReference("age", "3.5B")
            ]
        );

        await factory.create(
            [
                await Utils.createDBReference("name", "venus"),
                await Utils.createDBReference("age", "3.5B")
            ]
        );

        await factory.create(
            [
                await Utils.createDBReference("name", "earth"),
                await Utils.createDBReference("age", "3B"),
                await Utils.createDBReference("atmosphere", "yes"),
                await Utils.createDBReference("pressure", "1"),
                await Utils.createDBReference("habitable", "yes"),
            ]
        );

        let res = await factory.push();

        console.log("");

    }

}

let test = new Test();
test.testEntity();