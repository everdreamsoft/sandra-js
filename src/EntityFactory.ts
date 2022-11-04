import { Concept } from "./Concept";
import { DBAdapter } from "./DBAdapter";
import { Entity } from "./Entity";

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

    // Pushing entities to database
    async push() {

        let dbConcepts: string[][] = [];
        let dbTriplets: string[][] = [];

        let subjectId = 1;

        this.entityArray.forEach(entity => {
            let subject = entity.getSubject();
            subject.setId(subjectId);
            dbConcepts.push(entity.getSubject().getDBArrayFormat());
            dbTriplets.push(...entity.getTriplets().map(triplet => {
                return triplet.getDBArrayFormat();
            }));
            subjectId++;
        });

        let res = await (await DBAdapter.getInstance()).insertConcepts(dbConcepts);

        // Insert subject concept

        // Insert triplets

        // Insert references 

    }

    load() {

        // Load subject concept

        // Load triplets 

        // Load references 

    }

}