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
    getFactory() { return this.factory; }
    getPushedStatus() { return this.pushedStatus; }
    getRefs() { return this.references; }
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
    getEntityRefsAsKeyValue() {
        let m = new Map();
        this.references.forEach(r => {
            if (r.getTripletLink().getVerb().getShortname() == "contained_in_file")
                m.set(r.getIdConcept().getShortname(), r.getValue());
        });
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
    getRefsKeyValuesByTiplet(tripletLinkConcept) {
        let m = new Map();
        this.references.forEach(r => {
            if (r.getTripletLink().getVerb().isSame(tripletLinkConcept))
                m.set(r.getIdConcept().getShortname(), r.getValue());
        });
        return m;
    }
    getRefValByShortname(shortname) {
        let i = this.references.findIndex(ref => { return ref.getIdConcept().getShortname() == shortname; });
        if (i >= 0)
            return this.references[i].getValue();
    }
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
    getRef(concept) {
        if (concept) {
            let i = this.references.findIndex(ref => { return ref.getIdConcept().isSame(concept); });
            if (i >= 0)
                return this.references[i];
        }
        return null;
    }
    async brother(verb, target, refs = null, upsert = false) {
        return await this.addTriplet(await SystemConcepts_1.SystemConcepts.get(verb), await SystemConcepts_1.SystemConcepts.get(target), refs, true, upsert);
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