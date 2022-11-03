import { Concept } from "./Concept";
import { EntityFactory } from "./EntityFactory";
import { Reference } from "./Reference";
import { Triplet } from "./Triplet";
import { Utils } from "./Utils";

export class Entity {

    private subject: Concept;
    private triplets: Triplet[];
    private references: Reference[];

    private factory: EntityFactory;

    constructor(factory: EntityFactory, refs: Reference[]) {
        this.factory = factory;
        this.subject = new Concept(-1, "A " + this.factory.getIsAVerb(), null);
        this.triplets = [];
        this.references = refs;
        this.factory.add(this);
    }

    getSubject() { return this.subject; }
    getTriplets() { return this.triplets; }
    getRefs() { return this.references; }

    
    isEqualTo(entity: Entity) {

        let refs1 = entity.getRefs();
        let refs2 = this.references;

        if (this.factory.isSame(entity.factory)
        ) {

            let uniqueRef1 = refs1.find(ref => ref.getIdConcept().isSame(this.factory.getUniqueRefConcept()));
            let uniqueRef2 = refs2.find(ref => ref.getIdConcept().isSame(this.factory.getUniqueRefConcept()));

            if (uniqueRef1 && uniqueRef2)
                return uniqueRef1.isEqualTo(uniqueRef2);

            return false;
        }

        return false;

    }

    push() {
        this.factory.push();
    }

    load() {

    }

}