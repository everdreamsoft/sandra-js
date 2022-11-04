import { Concept } from "../src/Concept";
import { Entity } from "../src/Entity";
import { EntityFactory } from "../src/EntityFactory";
import { Reference } from "../src/Reference";
import { Utils } from "../src/Utils";

export class Test {

    async testEntity() {

        console.log("started test");

        let factory = new EntityFactory("planet", "planet_file", Utils.createMemoryConcept("name"));

        let entity0 = new Entity(factory, [
            Utils.createMemoryReference("name", "earth"),
            Utils.createMemoryReference("age", "3.5B")]
        );

        let entity1 = new Entity(factory, [
            Utils.createMemoryReference("name", "mars"),
            Utils.createMemoryReference("age", "3B")]
        );

        let entity3 = new Entity(factory, [
            Utils.createMemoryReference("name", "earth"),
            Utils.createMemoryReference("age", "4B")]
        );

        let res = await factory.push();

        console.log("");

    }

}

let test = new Test();
test.testEntity();