import { Concept } from "./Concept";
import { EntityFactory } from "./EntityFactory";
import { LogManager } from "./loggers/LogManager";
import { Reference } from "./Reference";
import { SystemConcepts } from "./SystemConcepts";
import { TemporaryId } from "./TemporaryId";
import { Triplet } from "./Triplet";

export class Entity {

    private subject: Concept;
    private triplets: Triplet[] = [];
    private references: Reference[] = [];
    private uniqueRefConcept: Concept;

    private upsert: boolean = false;
    private factory: EntityFactory;
    private pushedStatus: boolean = false;

    constructor() {
    }

    setSubject(subject: Concept) { this.subject = subject; }
    setRefs(refs: Reference[]) { this.references = refs; }
    setUniqueRefConcept(c: Concept) { this.uniqueRefConcept = c; }
    setFactory(factory: EntityFactory) { this.factory = factory; }
    setPushedStatus(status: boolean) { this.pushedStatus = status; }
    setUpsert(upsert: boolean) { this.upsert = upsert; }

    isUpsert() { return this.upsert; }

    getSubject() { return this.subject; }
    getTriplets() { return this.triplets; }
    getFactory() { return this.factory; }
    getPushedStatus() { return this.pushedStatus; }
    getRefs() { return this.references; }

    async addRef(ref: Reference) {
        if (ref.getTripletLink()) {
            this.references.push(ref);
        }
        else {
            let c = await SystemConcepts.get("contained_in_file");
            let i = this.triplets.findIndex(t => { return t.getVerb().isSame(c) });
            if (i >= 0) {
                ref.setTripletLink(this.triplets[i]);
                this.references.push(ref);
                return;
            }

            throw new Error("No triplet found to link reference");
        }
    }

    getEntityRefsAsKeyValue() {
        let m: Map<string, string> = new Map();
        this.references.forEach(r => {
            if (r.getTripletLink().getVerb().getShortname() == "contained_in_file")
                m.set(r.getIdConcept().getShortname(), r.getValue());
        })
        return m;
    }

    getEntityRefsAsJson() {

        let json = {};

        this.references.forEach(r => {
            if (r.getTripletLink().getVerb().getShortname() == "contained_in_file")
                json[r.getIdConcept().getShortname()] = r.getValue();
        });

        return json;
    }

    asJSON() {

        let json: any = {};

        json["subjectId"] = this.getSubject()?.getId();

        this.references.forEach(r => {
            json[r.getIdConcept().getShortname()] = r.getValue();
        });

        json["brothers"] = {};
        json["joined"] = {};

        this.triplets.forEach((t, i) => {

            let verb = t.getVerb()?.getShortname() ? t.getVerb()?.getShortname() : "tripletVerb" + i;

            if (t.getTarget().getShortname()?.length > 0) {
                json["brothers"][verb] = t.getTarget()?.getShortname();
            }
            else {
                if (t.getJoinedEntity()) {
                    json["joined"][verb] = t.getJoinedEntity()?.asJSON();
                }
                else {
                    json["joined"][verb] = {
                        "subjectId": t.getTarget()?.getId()
                    }
                }

            }

        });

        return json;

    }

    getRefsKeyValuesByTiplet(tripletLinkConcept: Concept) {

        let m: Map<string, string> = new Map();

        this.references.forEach(r => {
            if (r.getTripletLink().getVerb().isSame(tripletLinkConcept))
                m.set(r.getIdConcept().getShortname(), r.getValue());
        })
        return m;
    }

    getRefValByShortname(shortname: string) {
        let i = this.references.findIndex(ref => { return ref.getIdConcept().getShortname() == shortname });
        if (i >= 0)
            return this.references[i].getValue();
    }

    getTripletBrothersAsJson() {
        let json = {};
        this.triplets.forEach(t => {
            if (t.getVerb()?.getShortname()?.length > 0 && t.getTarget()?.getShortname()?.length > 0) {
                json[t.getVerb()?.getShortname()] = t.getTarget()?.getShortname();
            }
        })
        return json;
    }

    getRef(concept: Concept): Reference {
        if (concept) {
            let i = this.references.findIndex(ref => { return ref.getIdConcept().isSame(concept) });
            if (i >= 0)
                return this.references[i];
        }
        return null;
    }

    async brother(verb: string, target: string, refs: Reference[] = null, upsert: boolean = false): Promise<Triplet> {
        return await this.addTriplet(await SystemConcepts.get(verb), await SystemConcepts.get(target), refs, true, upsert);
    }

    async join(verb: string, entity: Entity, refs: Reference[] = null): Promise<Triplet> {

        let verbConcept = await SystemConcepts.get(verb);

        let i = this.triplets.findIndex(t => {
            return t.getVerb().isSame(verbConcept) && t.getJoinedEntity().getSubject().getId() == entity.getSubject().getId()
        });

        if (i >= 0) {
            LogManager.getInstance().info("adding same triplets again for entity subject - " + this.getSubject().getId() + " " + this.getFactory().getFullName());
            return this.triplets[i];
        }

        let t = await this.addTriplet(await SystemConcepts.get(verb), entity.getSubject(), refs, false)

        t.setJoinedEntity(entity);

        return t;
    }

    async addTriplet(verb: Concept, target: Concept, refs: Reference[] = null, checkExisting: boolean = true, upsert: boolean = false) {

        if (checkExisting) {

            let i = this.triplets.findIndex(t => {
                return t.isSame(verb, target)
            });

            if (i >= 0) {

                // LogManager.getInstance().info("adding same triplets again for entity subject - " + this.getSubject().getId() + " " + this.getFactory().getFullName())

                this.triplets[i].setUpsert(upsert);

                let existingRefs = this.getRefs();
                // Add non existing refs with current entity or replace the value for same verb
                refs?.forEach(r => {

                    let rIndex = existingRefs.findIndex(rI => { return rI.getIdConcept().isSame(r.getIdConcept()) });

                    if (rIndex >= 0) {
                        existingRefs[rIndex].setValue(r.getValue());
                    }
                    else {
                        r.setTripletLink(this.triplets[i]);
                        existingRefs.push(r);
                    }
                });

                return this.triplets[i];

            }


        }

        let t = new Triplet(TemporaryId.create(), this.subject, verb, target, false, upsert);
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