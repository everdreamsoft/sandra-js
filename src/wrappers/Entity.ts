
import { LogManager } from "../loggers/LogManager";
import { Concept } from "../models/Concept";
import { Reference } from "../models/Reference";
import { SystemConcepts } from "../models/SystemConcepts";
import { Triplet } from "../models/Triplet";
import { TemporaryId } from "../utils/TemporaryId";
import { EntityFactory } from "./EntityFactory";

export class Entity {

    private subject: Concept | undefined;
    private triplets: Triplet[] = [];
    private references: Reference[] = [];
    private uniqueRefConcept: Concept | undefined;

    private upsert: boolean = false;
    private factory: EntityFactory;
    private pushedStatus: boolean = false;

    constructor(factory: EntityFactory) {
        this.factory = factory;
    }

    /**
     * Sets subject concept for current entity.
     * @param subject Subject concept object.
     */
    setSubject(subject: Concept) { this.subject = subject; }

    /**
     * Sets refs array for current entity object.
     * @param refs 
     */
    setRefs(refs: Reference[]) { this.references = refs; }

    /**
     * Sets unique referance concpet
     * @param c Unique referance concept. 
     */
    setUniqueRefConcept(c: Concept) { this.uniqueRefConcept = c; }

    /**
     * Sets factory class
     * @param factory EntityFactory object.
     */
    setFactory(factory: EntityFactory) { this.factory = factory; }

    /**
     * Sets pushed status of given entity, It is set to true when entity object is loaded from DB.
     * In order to update the loaded entity again this can be set to false, else it is ignore for DB updates in some 
     * functions.
     * @param status 
     */
    setPushedStatus(status: boolean) { this.pushedStatus = status; }

    /**
     * If set to true then entity references are marked for updates if they exist in DB. Else references are 
     * ignored or added.
     * @param upsert 
     */
    setUpsert(upsert: boolean) { this.upsert = upsert; }

    /**
     * Returns true if entity references are marked to updates
     * @returns 
     */
    isUpsert() { return this.upsert; }

    /**
     * 
     * @returns Returns subject concept of current entity object.
     */
    getSubject() { return this.subject; }

    /**
     * 
     * @returns Return all the triplets attached to entity object.
     */
    getTriplets() { return this.triplets; }

    /**
     * 
     * @returns Returns factory class object of current entity object.
     */
    getFactory() { return this.factory; }

    /**
     * It is usually set when entities are loaded from the DB.
     * @returns Returns true if a load function is called and entity subject is present in DB.
     */
    getPushedStatus() { return this.pushedStatus; }

    /**
     * 
     * @returns Returns reference list of current entity.
     */
    getRefs() { return this.references; }

    /**
     * 
     * @returns Returns a map object containing key and value pair of all the references 
     */
    getEntityRefsAsKeyValue() {
        let m: Map<string, string> = new Map();
        this.references.forEach(r => {
            if (r.getTripletLink()?.getVerb()?.getShortname() == "contained_in_file") {
                let key = r.getIdConcept()?.getShortname();
                if (key)
                    m.set(key, r.getValue());
            }
        })
        return m;
    }


    /**
     * 
     * @param tripletVerbShotname Shortname of triplet verb to get reference for
     * @returns Refs as json 
     */
    getEntityRefsAsJson(triplet?: Triplet) {

        let json: any = {};

        this.references.forEach(r => {
            if (triplet) {
                if (r.getTripletLink()?.getId() == triplet.getId()) {
                    let key = r.getIdConcept()?.getShortname();
                    if (key)
                        json[key] = r.getValue();
                }
            }
            else
                if (r.getTripletLink()?.getVerb()?.getShortname() == "contained_in_file") {
                    let key = r.getIdConcept()?.getShortname();
                    if (key)
                        json[key] = r.getValue();
                }
        });

        return json;
    }

    /**
     * 
     * @returns Return entity values as json including refs, brothers and joined entities 
     * In case joined entity is not fully loaded it will return its subject id's.
     */
    asJSON() {

        let json: any = {};

        json["subjectId"] = this.getSubject()?.getId();

        this.references.forEach(r => {
            let key = r.getIdConcept()?.getShortname();
            if (key)
                json[key] = r.getValue();
        });

        json["brothers"] = {};
        json["joined"] = {};

        this.triplets.forEach((t, i) => {

            let verb = t.getVerb()?.getShortname() ? t.getVerb()?.getShortname() : "tripletVerb" + i;

            let sn = t.getTarget()?.getShortname();

            if (sn && sn.length > 0) {
                if (verb)
                    json["brothers"][verb] = sn;
            }
            else {
                if (verb)
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

    /**
     * 
     * @param tripletLinkConcept Concpet object of the linked triplet.
     * @returns Returns map of key value pair of the reference linked to given concept. 
     */
    getRefsKeyValuesByTiplet(tripletLinkConcept: Concept) {
        let m: Map<string, string> = new Map();
        this.references.forEach(r => {
            if (r.getTripletLink()?.getVerb()?.isEqual(tripletLinkConcept)) {
                let sn = r.getIdConcept()?.getShortname();
                if (sn)
                    m.set(sn, r.getValue());
            }
        })
        return m;
    }

    /**
     * 
     * @param shortname 
     * @returns Returns the value of reference with given shortname 
     */
    getRefValByShortname(shortname: string) {
        let i = this.references.findIndex(ref => {
            return ref.getIdConcept()?.getShortname() == shortname
        });
        if (i >= 0)
            return this.references[i].getValue();
    }

    /**
     * 
     * @returns Returns all the brothers triplets as json 
     */
    getTripletBrothersAsJson() {
        let json: any = {};
        this.triplets.forEach(t => {
            let sn1 = t.getVerb()?.getShortname();
            let sn2 = t.getTarget()?.getShortname();
            if (sn1 && sn2 && sn1.length > 0 && sn2.length > 0) {
                json[sn1] = t.getTarget()?.getShortname();
            }
        })
        return json;
    }

    /**
     * 
     * @param concept 
     * @returns Returns reference object for given concept 
     */
    getRef(concept: Concept): Reference | undefined {
        if (concept) {
            let i = this.references.findIndex(ref => { return ref.getIdConcept()?.isEqual(concept) });
            if (i >= 0)
                return this.references[i];
        }
        return undefined;
    }

    /**
     * 
     * @param ref 
     * @returns Adds given reference object to current entity 
     */
    async addRef(ref: Reference) {
        if (ref.getTripletLink()) {
            this.references.push(ref);
        }
        else {
            let c = await SystemConcepts.get("contained_in_file", this.factory.getServerName());
            let i = this.triplets.findIndex(t => { return t.getVerb()?.isEqual(c) });
            if (i >= 0) {
                ref.setTripletLink(this.triplets[i]);
                this.references.push(ref);
                return;
            }

            throw new Error("No triplet found to link reference");
        }
    }

    /**
     * Adds brother triplet to current entity object. 
     * @param verb Verb string for brother triplet.
     * @param target Target string for brother triplet.
     * @param refs Refs array to attach with brother triplet.
     * @param upsert If true triplet will be updated if exist or added if does not exist. Else it will ignored or added.
     * @returns Return triplet object created for added brother triplet
     */
    async brother(verb: string, target: string, refs: Reference[] | undefined = undefined, upsert: boolean = false): Promise<Triplet> {
        return await this.addTriplet(await SystemConcepts.get(verb, this.factory.getServerName()), await SystemConcepts.get(target, this.factory.getServerName()), refs, true, upsert);
    }

    /**
     * Adds joined enitty to current entity object.
     * @param verb Joined verb concept object.
     * @param entity Entity object to join on given verb.
     * @param refs Referance array to attach with given triplet verb.
     * @returns Triplet object of the triplet created for joined entity.
     */
    async join(verb: string, entity: Entity, refs: Reference[] | undefined = undefined): Promise<Triplet> {

        let verbConcept = await SystemConcepts.get(verb, this.factory.getServerName());

        let i = this.triplets.findIndex(t => {
            return t.getVerb()?.isEqual(verbConcept) && t.getJoinedEntity()?.getSubject()?.getId() == entity.getSubject()?.getId()
        });

        if (i >= 0) {
            LogManager.getInstance().info("adding same triplets again for entity subject - " + this.getSubject()?.getId() + " " + this.getFactory()?.getFullName());
            return this.triplets[i];
        }

        let t = await this.addTriplet(await SystemConcepts.get(verb, this.factory.getServerName()), entity.getSubject(), refs, false)

        t.setJoinedEntity(entity);

        return t;
    }

    /**
     * Adds a triplet to current entity object.
     * @param verb Verb concept .
     * @param target Target concept.
     * @param refs Refs attached to this triplet.
     * @param checkExisting If true, it will check if there is a triplet with provided verb concept.
     * @param upsert If set to true then triplet entry will be updated/inserted else it will be ignored/added.
     * @returns Added triplet will be returned back.
     */
    async addTriplet(verb: Concept, target: Concept | undefined, refs: Reference[] | undefined = undefined, checkExisting: boolean = true, upsert: boolean = false) {

        if (checkExisting) {

            let i = this.triplets.findIndex(t => {
                return t.getVerb()?.isEqual(verb) && t.getTarget()?.isEqual(target);
            });

            if (i >= 0) {

                // LogManager.getInstance().info("adding same triplets again for entity subject - " + this.getSubject().getId() + " " + this.getFactory().getFullName())

                this.triplets[i].setUpsert(upsert);

                let existingRefs = this.getRefs();
                // Add non existing refs with current entity or replace the value for same verb
                refs?.forEach(r => {

                    let rIndex = existingRefs.findIndex(rI => { return rI.getIdConcept()?.isEqual(r.getIdConcept()) });

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

    /**
     * Compares current object with given entity object, validates "is_a" and "contained_in_file" concepts 
     * with subject ids. 
     * @param entity Entity object to compare with.
     * @returns Return true if given entity has same factory class with same subject ids.
     */
    isEqualTo(entity: Entity) {

        // Check the entity triplets is_a and contained_in_file 
        let tripets1 = entity.getTriplets();
        let tripets2 = this.getTriplets();

        // Compare if they are same
        let is_a_triplet1 = tripets1.find(t => t.getVerb()?.getShortname() === "is_a");
        let is_a_triplet2 = tripets2.find(t => t.getVerb()?.getShortname() === "is_a");

        if (is_a_triplet1?.getTarget()?.getShortname() != is_a_triplet2?.getTarget()?.getShortname()
        ) return false;

        let contained_in_file1 = tripets1.find(t => t.getVerb()?.getShortname() === "contained_in_file");
        let contained_in_file2 = tripets2.find(t => t.getVerb()?.getShortname() === "contained_in_file");

        if (contained_in_file1?.getTarget()?.getShortname() != contained_in_file2?.getTarget()?.getShortname()
        ) return false;


        let refs1 = entity.getRefs();
        let refs2 = this.references;

        let uniqueRef1 = refs1.find(ref => ref.getIdConcept()?.isEqual(this.uniqueRefConcept));
        let uniqueRef2 = refs2.find(ref => ref.getIdConcept()?.isEqual(this.uniqueRefConcept));

        if (uniqueRef1 && uniqueRef2)
            return uniqueRef1.isEqual(uniqueRef2);


        return false;

    }

}