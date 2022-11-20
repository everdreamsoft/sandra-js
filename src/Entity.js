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
    setSubject(subject) { this.subject = subject; }
    setRefs(refs) { this.references = refs; }
    setUniqueRefConcept(c) { this.uniqueRefConcept = c; }
    setFactory(factory) { this.factory = factory; }
    setPushedStatus(status) { this.pushedStatus = status; }
    setUpsert(upsert) { this.upsert = upsert; }
    isUpsert() { return this.upsert; }
    getSubject() { return this.subject; }
    getTriplets() { return this.triplets; }
    getRefs() { return this.references; }
    getFactory() { return this.factory; }
    getPushedStatus() { return this.pushedStatus; }
    getRef(concept) {
        if (concept) {
            let i = this.references.findIndex(ref => { return ref.getIdConcept().isSame(concept); });
            if (i >= 0)
                return this.references[i];
        }
        return null;
    }
    async brother(verb, target, refs = null) {
        return await this.addTriplet(await SystemConcepts_1.SystemConcepts.get(verb), await SystemConcepts_1.SystemConcepts.get(target), refs);
    }
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
    async addTriplet(verb, target, refs = null, checkExisting = true) {
        if (checkExisting) {
            let i = this.triplets.findIndex(t => {
                return t.isSame(verb, target);
            });
            if (i >= 0) {
                LogManager_1.LogManager.getInstance().info("adding same triplets again for entity subject - " + this.getSubject().getId() + " " + this.getFactory().getFullName());
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
        let t = new Triplet_1.Triplet(TemporaryId_1.TemporaryId.create(), this.subject, verb, target);
        this.triplets.push(t);
        if (refs && (refs === null || refs === void 0 ? void 0 : refs.length) > 0) {
            refs.forEach(ref => ref.setTripletLink(t));
            this.references.push(...refs);
        }
        return t;
    }
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