import { Concept } from "./Concept";
import { EntityFactory } from "./EntityFactory";
import { Reference } from "./Reference";
import { SystemConcepts } from "./SystemConcepts";
import { Triplet } from "./Triplet";

export class Entity {

    private subject: Concept;
    private triplets: Triplet[] = [];
    private references: Reference[] = [];
    private uniqueRefConcept: Concept;

    private factory: EntityFactory;
    private pushedStatus: boolean = false;

    constructor() {
    }

    setSubject(subject: Concept) { this.subject = subject; }
    setRefs(refs: Reference[]) { this.references = refs; }
    setUniqueRefConcept(c: Concept) { this.uniqueRefConcept = c; }
    setFactory(factory: EntityFactory) { this.factory = factory; }
    setPushedStatus(status: boolean) { this.pushedStatus = status; }

    getSubject() { return this.subject; }
    getTriplets() { return this.triplets; }
    getRefs() { return this.references; }
    getFactory() { return this.factory; }
    getPushedStatus() { return this.pushedStatus; }



    getRef(concept: Concept): Reference {
        if (concept) {
            let i = this.references.findIndex(ref => { return ref.getIdConcept().isSame(concept) });
            if (i >= 0)
                return this.references[i];
        }
        return null;
    }

    async brother(verb: string, target: string, refs: Reference[] = null): Promise<Triplet> {
        return await this.addTriplet(await SystemConcepts.get(verb), await SystemConcepts.get(target), refs)
    }

    async join(verb: string, entity: Entity, refs: Reference[] = null): Promise<Triplet> {
        let t = await this.addTriplet(await SystemConcepts.get(verb), entity.getSubject(), refs)
        t.setJoinedEntity(entity);
        return t;
    }

    async addTriplet(verb: Concept, target: Concept, refs: Reference[] = null) {

        let t = new Triplet(-1, this.subject, verb, target);
        this.triplets.push(t);

        if (refs && refs?.length > 0) {
            refs.forEach(ref => ref.setTripletLink(t));
            this.references.push(...refs);
        }

        return t;
    }

    isEqualTo(entity: Entity) {

        // Check the entity triplets is_a and contained_in_file 
        let tripets1 = entity.getTriplets();
        let tripets2 = this.getTriplets();

        // Compare if they are same
        let is_a_triplet1 = tripets1.find(t => t.getVerb().getShortname() === "is_a");
        let is_a_triplet2 = tripets2.find(t => t.getVerb().getShortname() === "is_a");

        if (is_a_triplet1.getTarget().getShortname() != is_a_triplet2.getTarget().getShortname()
        ) return false;

        let contained_in_file1 = tripets1.find(t => t.getVerb().getShortname() === "contained_in_file");
        let contained_in_file2 = tripets2.find(t => t.getVerb().getShortname() === "contained_in_file");

        if (contained_in_file1.getTarget().getShortname() != contained_in_file2.getTarget().getShortname()
        ) return false;


        let refs1 = entity.getRefs();
        let refs2 = this.references;

        let uniqueRef1 = refs1.find(ref => ref.getIdConcept().isSame(this.uniqueRefConcept));
        let uniqueRef2 = refs2.find(ref => ref.getIdConcept().isSame(this.uniqueRefConcept));

        if (uniqueRef1 && uniqueRef2)
            return uniqueRef1.isEqualTo(uniqueRef2);


        return false;

    }

}