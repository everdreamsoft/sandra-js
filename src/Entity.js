"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entity = void 0;
const LogManager_1 = require("./loggers/LogManager");
const SystemConcepts_1 = require("./SystemConcepts");
const TemporaryId_1 = require("./TemporaryId");
const Triplet_1 = require("./Triplet");
class Entity {
    constructor() {
        this.triplets = [];
        this.references = [];
        this.upsert = false;
        this.pushedStatus = false;
    }
    /**
     * Sets subject concept for current entity.
     * @param subject Subject concept object.
     */
    setSubject(subject) { this.subject = subject; }
    /**
     * Sets refs array for current entity object.
     * @param refs
     */
    setRefs(refs) { this.references = refs; }
    /**
     * Sets unique referance concpet
     * @param c Unique referance concept.
     */
    setUniqueRefConcept(c) { this.uniqueRefConcept = c; }
    /**
     * Sets factory class
     * @param factory EntityFactory object.
     */
    setFactory(factory) { this.factory = factory; }
    /**
     * Sets pushed status of given entity, It is set to true when entity object is loaded from DB.
     * In order to update the loaded entity again this can be set to false, else it is ignore for DB updates in some
     * functions.
     * @param status
     */
    setPushedStatus(status) { this.pushedStatus = status; }
    /**
     * If set to true then entity references are marked for updates if they exist in DB. Else references are
     * ignored or added.
     * @param upsert
     */
    setUpsert(upsert) { this.upsert = upsert; }
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
        let m = new Map();
        this.references.forEach(r => {
            if (r.getTripletLink().getVerb().getShortname() == "contained_in_file")
                m.set(r.getIdConcept().getShortname(), r.getValue());
        });
        return m;
    }
    /**
     *
     * @returns Return refs as json
     */
    getEntityRefsAsJson() {
        let json = {};
        this.references.forEach(r => {
            if (r.getTripletLink().getVerb().getShortname() == "contained_in_file")
                json[r.getIdConcept().getShortname()] = r.getValue();
        });
        return json;
    }
    /**
     *
     * @returns Return entity values as json including refs, brothers and joined entities
     * In case joined entity is not fully loaded it will return its subject id's.
     */
    asJSON() {
        var _a;
        let json = {};
        json["subjectId"] = (_a = this.getSubject()) === null || _a === void 0 ? void 0 : _a.getId();
        this.references.forEach(r => {
            json[r.getIdConcept().getShortname()] = r.getValue();
        });
        json["brothers"] = {};
        json["joined"] = {};
        this.triplets.forEach((t, i) => {
            var _a, _b, _c, _d, _e, _f;
            let verb = ((_a = t.getVerb()) === null || _a === void 0 ? void 0 : _a.getShortname()) ? (_b = t.getVerb()) === null || _b === void 0 ? void 0 : _b.getShortname() : "tripletVerb" + i;
            if (((_c = t.getTarget().getShortname()) === null || _c === void 0 ? void 0 : _c.length) > 0) {
                json["brothers"][verb] = (_d = t.getTarget()) === null || _d === void 0 ? void 0 : _d.getShortname();
            }
            else {
                if (t.getJoinedEntity()) {
                    json["joined"][verb] = (_e = t.getJoinedEntity()) === null || _e === void 0 ? void 0 : _e.asJSON();
                }
                else {
                    json["joined"][verb] = {
                        "subjectId": (_f = t.getTarget()) === null || _f === void 0 ? void 0 : _f.getId()
                    };
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
    getRefsKeyValuesByTiplet(tripletLinkConcept) {
        let m = new Map();
        this.references.forEach(r => {
            if (r.getTripletLink().getVerb().isSame(tripletLinkConcept))
                m.set(r.getIdConcept().getShortname(), r.getValue());
        });
        return m;
    }
    /**
     *
     * @param shortname
     * @returns Returns the value of reference with given shortname
     */
    getRefValByShortname(shortname) {
        let i = this.references.findIndex(ref => { return ref.getIdConcept().getShortname() == shortname; });
        if (i >= 0)
            return this.references[i].getValue();
    }
    /**
     *
     * @returns Returns all the brothers triplets as json
     */
    getTripletBrothersAsJson() {
        let json = {};
        this.triplets.forEach(t => {
            var _a, _b, _c, _d, _e, _f;
            if (((_b = (_a = t.getVerb()) === null || _a === void 0 ? void 0 : _a.getShortname()) === null || _b === void 0 ? void 0 : _b.length) > 0 && ((_d = (_c = t.getTarget()) === null || _c === void 0 ? void 0 : _c.getShortname()) === null || _d === void 0 ? void 0 : _d.length) > 0) {
                json[(_e = t.getVerb()) === null || _e === void 0 ? void 0 : _e.getShortname()] = (_f = t.getTarget()) === null || _f === void 0 ? void 0 : _f.getShortname();
            }
        });
        return json;
    }
    /**
     *
     * @param concept
     * @returns Returns reference object for given concept
     */
    getRef(concept) {
        if (concept) {
            let i = this.references.findIndex(ref => { return ref.getIdConcept().isSame(concept); });
            if (i >= 0)
                return this.references[i];
        }
        return null;
    }
    /**
     *
     * @param ref
     * @returns Adds given reference object to current entity
     */
    async addRef(ref) {
        if (ref.getTripletLink()) {
            this.references.push(ref);
        }
        else {
            let c = await SystemConcepts_1.SystemConcepts.get("contained_in_file");
            let i = this.triplets.findIndex(t => { return t.getVerb().isSame(c); });
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
    async brother(verb, target, refs = null, upsert = false) {
        return await this.addTriplet(await SystemConcepts_1.SystemConcepts.get(verb), await SystemConcepts_1.SystemConcepts.get(target), refs, true, upsert);
    }
    /**
     * Adds joined enitty to current entity object.
     * @param verb Joined verb concept object.
     * @param entity Entity object to join on given verb.
     * @param refs Referance array to attach with given triplet verb.
     * @returns Triplet object of the triplet created for joined entity.
     */
    async join(verb, entity, refs = null) {
        let verbConcept = await SystemConcepts_1.SystemConcepts.get(verb);
        let i = this.triplets.findIndex(t => {
            return t.getVerb().isSame(verbConcept) && t.getJoinedEntity().getSubject().getId() == entity.getSubject().getId();
        });
        if (i >= 0) {
            LogManager_1.LogManager.getInstance().info("adding same triplets again for entity subject - " + this.getSubject().getId() + " " + this.getFactory().getFullName());
            return this.triplets[i];
        }
        let t = await this.addTriplet(await SystemConcepts_1.SystemConcepts.get(verb), entity.getSubject(), refs, false);
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
    async addTriplet(verb, target, refs = null, checkExisting = true, upsert = false) {
        if (checkExisting) {
            let i = this.triplets.findIndex(t => {
                return t.isSame(verb, target);
            });
            if (i >= 0) {
                // LogManager.getInstance().info("adding same triplets again for entity subject - " + this.getSubject().getId() + " " + this.getFactory().getFullName())
                this.triplets[i].setUpsert(upsert);
                let existingRefs = this.getRefs();
                // Add non existing refs with current entity or replace the value for same verb
                refs === null || refs === void 0 ? void 0 : refs.forEach(r => {
                    let rIndex = existingRefs.findIndex(rI => { return rI.getIdConcept().isSame(r.getIdConcept()); });
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
        let t = new Triplet_1.Triplet(TemporaryId_1.TemporaryId.create(), this.subject, verb, target, false, upsert);
        this.triplets.push(t);
        if (refs && (refs === null || refs === void 0 ? void 0 : refs.length) > 0) {
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
    isEqualTo(entity) {
        // Check the entity triplets is_a and contained_in_file 
        let tripets1 = entity.getTriplets();
        let tripets2 = this.getTriplets();
        // Compare if they are same
        let is_a_triplet1 = tripets1.find(t => t.getVerb().getShortname() === "is_a");
        let is_a_triplet2 = tripets2.find(t => t.getVerb().getShortname() === "is_a");
        if (is_a_triplet1.getTarget().getShortname() != is_a_triplet2.getTarget().getShortname())
            return false;
        let contained_in_file1 = tripets1.find(t => t.getVerb().getShortname() === "contained_in_file");
        let contained_in_file2 = tripets2.find(t => t.getVerb().getShortname() === "contained_in_file");
        if (contained_in_file1.getTarget().getShortname() != contained_in_file2.getTarget().getShortname())
            return false;
        let refs1 = entity.getRefs();
        let refs2 = this.references;
        let uniqueRef1 = refs1.find(ref => ref.getIdConcept().isSame(this.uniqueRefConcept));
        let uniqueRef2 = refs2.find(ref => ref.getIdConcept().isSame(this.uniqueRefConcept));
        if (uniqueRef1 && uniqueRef2)
            return uniqueRef1.isEqualTo(uniqueRef2);
        return false;
    }
}
exports.Entity = Entity;
//# sourceMappingURL=Entity.js.map