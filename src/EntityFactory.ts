import { Concept } from "./Concept";
import { DBAdapter } from "./DBAdapter";
import { Entity } from "./Entity";
import { Reference } from "./Reference";
import { SystemConcepts } from "./SystemConcepts";
import { Triplet } from "./Triplet";
import { Utils } from "./Utils";

export class EntityFactory {

    private is_a: string
    private contained_in_file: string
    private uniqueRefConcept: Concept;

    private entityArray: Entity[] = [];

    constructor(is_a: string, contained_in_file: string, uniqueRefConcept: Concept) {
        this.is_a = is_a;
        this.contained_in_file = contained_in_file;
        this.uniqueRefConcept = uniqueRefConcept;
    }

    async create(refs: Reference[]): Promise<Entity> {

        let e = new Entity();

        let subConcept = new Concept(-1, Concept.ENTITY_CONCEPT_CODE_PREFIX + this.getIsAVerb(), null);

        e.setFactory(this);

        e.setSubject(subConcept);

        // Set unique ref concept
        e.setUniqueRefConcept(this.uniqueRefConcept);

        // Adding is_a verb triplet
        await e.brother("is_a", this.is_a);

        // Adding contained_in_file triplet
        await e.brother("contained_in_file", this.contained_in_file, refs);

        // Adding it to the factory list
        this.add(e);

        return e;

    }

    getIsAVerb() {
        return this.is_a;
    }

    getContainedInFileVerb() {
        return this.contained_in_file;
    }

    isSame(factory: EntityFactory): boolean {
        return this.is_a == factory.getIsAVerb() && this.contained_in_file == factory.getContainedInFileVerb();
    }

    getUniqueRefConcept() {
        return this.uniqueRefConcept;
    }

    add(entity: Entity) {

        if (this.uniqueRefConcept && this.uniqueRefConcept.getShortname().length > 0) {
            let index = this.entityArray.findIndex(e => e.isEqualTo(entity));
            if (index >= 0) {
                this.entityArray[index] = entity;
            }
            else {
                this.entityArray.push(entity);
            }
        }
        else
            this.entityArray.push(entity);

    }

    // Pushing entities to database, without batch insertion //
    async push() {

        for (let index = 0; index < this.entityArray.length; index++) {

            let entity = this.entityArray[index];

            if (entity.getPushedStatus()) { continue; }

            // Create subject 
            await (await DBAdapter.getInstance()).addConcept(entity.getSubject());

            // Create triplets
            for (let indexTriplet = 0; indexTriplet < entity.getTriplets().length; indexTriplet++) {

                let t = entity.getTriplets()[indexTriplet];

                // Check if this is joined entity othewise push it also
                if (t.getJoinedentity()) {
                    await t.getJoinedentity().getFactory().push();
                }

                await (await DBAdapter.getInstance()).addTriplet(t);

            }

            // Create refs
            for (let indexRef = 0; indexRef < entity.getRefs().length; indexRef++) {
                await (await DBAdapter.getInstance()).addRefs(entity.getRefs()[indexRef]);
            }

            entity.setPushedStatus(true);

        }

    }

    load() {

    }

}

