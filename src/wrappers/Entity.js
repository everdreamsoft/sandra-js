"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entity = void 0;
const LogManager_1 = require("../loggers/LogManager");
const SystemConcepts_1 = require("../models/SystemConcepts");
const Triplet_1 = require("../models/Triplet");
const TemporaryId_1 = require("../utils/TemporaryId");
class Entity {
    constructor(factory) {
        this.triplets = [];
        this.references = [];
        this.upsert = false;
        this.pushedStatus = false;
        this.factory = factory;
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
            var _a, _b, _c;
            if (((_b = (_a = r.getTripletLink()) === null || _a === void 0 ? void 0 : _a.getVerb()) === null || _b === void 0 ? void 0 : _b.getShortname()) == "contained_in_file") {
                let key = (_c = r.getIdConcept()) === null || _c === void 0 ? void 0 : _c.getShortname();
                if (key)
                    m.set(key, r.getValue());
            }
        });
        return m;
    }
    /**
     *
     * @param tripletVerbShotname Shortname of triplet verb to get reference for
     * @returns Refs as json
     */
    getEntityRefsAsJson(triplet) {
        let json = {};
        this.references.forEach(r => {
            var _a, _b, _c, _d, _e;
            if (triplet) {
                if (((_a = r.getTripletLink()) === null || _a === void 0 ? void 0 : _a.getId()) == triplet.getId()) {
                    let key = (_b = r.getIdConcept()) === null || _b === void 0 ? void 0 : _b.getShortname();
                    if (key)
                        json[key] = r.getValue();
                }
            }
            else if (((_d = (_c = r.getTripletLink()) === null || _c === void 0 ? void 0 : _c.getVerb()) === null || _d === void 0 ? void 0 : _d.getShortname()) == "contained_in_file") {
                let key = (_e = r.getIdConcept()) === null || _e === void 0 ? void 0 : _e.getShortname();
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
        var _a;
        let json = {};
        json["subjectId"] = (_a = this.getSubject()) === null || _a === void 0 ? void 0 : _a.getId();
        this.references.forEach(r => {
            var _a, _b, _c;
            if (((_b = (_a = r.getTripletLink()) === null || _a === void 0 ? void 0 : _a.getVerb()) === null || _b === void 0 ? void 0 : _b.getShortname()) == "contained_in_file") {
                let key = (_c = r.getIdConcept()) === null || _c === void 0 ? void 0 : _c.getShortname();
                if (key)
                    json[key] = r.getValue();
            }
        });
        json["brothers"] = {};
        json["joined"] = [];
        this.triplets.forEach((t, i) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            let verb = ((_a = t.getVerb()) === null || _a === void 0 ? void 0 : _a.getShortname()) ? (_b = t.getVerb()) === null || _b === void 0 ? void 0 : _b.getShortname() : "tripletVerb" + i;
            let sn = (_c = t.getTarget()) === null || _c === void 0 ? void 0 : _c.getShortname();
            if (sn && sn.length > 0) {
                if (verb) {
                    json["brothers"][verb] = { "value": sn };
                    if (verb != "contained_in_file") {
                        let rfs = (_d = this.references) === null || _d === void 0 ? void 0 : _d.filter(r => { var _a; return ((_a = r.getTripletLink()) === null || _a === void 0 ? void 0 : _a.getId()) == t.getId(); });
                        if ((rfs === null || rfs === void 0 ? void 0 : rfs.length) > 0) {
                            let a = json["brothers"][verb];
                            a["refs"] = {};
                            rfs.forEach(r => {
                                var _a;
                                let key = (_a = r.getIdConcept()) === null || _a === void 0 ? void 0 : _a.getShortname();
                                if (key)
                                    a["refs"][key] = r.getValue();
                            });
                        }
                    }
                }
            }
            else {
                if (verb) {
                    let j = {};
                    if (t.getJoinedEntity()) {
                        j[verb] = (_e = t.getJoinedEntity()) === null || _e === void 0 ? void 0 : _e.asJSON();
                        let rfs = (_f = this.references) === null || _f === void 0 ? void 0 : _f.filter(r => { var _a; return ((_a = r.getTripletLink()) === null || _a === void 0 ? void 0 : _a.getId()) == t.getId(); });
                        if ((rfs === null || rfs === void 0 ? void 0 : rfs.length) > 0) {
                            let a = j[verb];
                            a["refs"] = {};
                            rfs.forEach(r => {
                                var _a;
                                let key = (_a = r.getIdConcept()) === null || _a === void 0 ? void 0 : _a.getShortname();
                                if (key)
                                    a["refs"][key] = r.getValue();
                            });
                        }
                    }
                    else {
                        j[verb] = { "subjectId": (_g = t.getTarget()) === null || _g === void 0 ? void 0 : _g.getId() };
                        let rfs = (_h = this.references) === null || _h === void 0 ? void 0 : _h.filter(r => { var _a; return ((_a = r.getTripletLink()) === null || _a === void 0 ? void 0 : _a.getId()) == t.getId(); });
                        if ((rfs === null || rfs === void 0 ? void 0 : rfs.length) > 0) {
                            let a = j[verb];
                            a["refs"] = {};
                            rfs.forEach(r => {
                                var _a;
                                let key = (_a = r.getIdConcept()) === null || _a === void 0 ? void 0 : _a.getShortname();
                                if (key)
                                    a["refs"][key] = r.getValue();
                            });
                        }
                    }
                    json["joined"].push(j);
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
            var _a, _b, _c;
            if ((_b = (_a = r.getTripletLink()) === null || _a === void 0 ? void 0 : _a.getVerb()) === null || _b === void 0 ? void 0 : _b.isEqual(tripletLinkConcept)) {
                let sn = (_c = r.getIdConcept()) === null || _c === void 0 ? void 0 : _c.getShortname();
                if (sn)
                    m.set(sn, r.getValue());
            }
        });
        return m;
    }
    /**
     *
     * @param shortname
     * @returns Returns the value of reference with given shortname
     */
    getRefValByShortname(shortname) {
        let i = this.references.findIndex(ref => {
            var _a;
            return ((_a = ref.getIdConcept()) === null || _a === void 0 ? void 0 : _a.getShortname()) == shortname;
        });
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
            var _a, _b, _c;
            let sn1 = (_a = t.getVerb()) === null || _a === void 0 ? void 0 : _a.getShortname();
            let sn2 = (_b = t.getTarget()) === null || _b === void 0 ? void 0 : _b.getShortname();
            if (sn1 && sn2 && sn1.length > 0 && sn2.length > 0) {
                json[sn1] = (_c = t.getTarget()) === null || _c === void 0 ? void 0 : _c.getShortname();
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
            let i = this.references.findIndex(ref => { var _a; return (_a = ref.getIdConcept()) === null || _a === void 0 ? void 0 : _a.isEqual(concept); });
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
    async addRef(ref) {
        if (ref.getTripletLink()) {
            this.references.push(ref);
        }
        else {
            let c = await SystemConcepts_1.SystemConcepts.get("contained_in_file", this.factory.getServerName());
            let i = this.triplets.findIndex(t => { var _a; return (_a = t.getVerb()) === null || _a === void 0 ? void 0 : _a.isEqual(c); });
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
    async brother(verb, target, refs = undefined, upsert = false) {
        return await this.addTriplet(await SystemConcepts_1.SystemConcepts.get(verb, this.factory.getServerName()), await SystemConcepts_1.SystemConcepts.get(target, this.factory.getServerName()), refs, true, upsert);
    }
    /**
     * Adds joined enitty to current entity object.
     * @param verb Joined verb concept object.
     * @param entity Entity object to join on given verb.
     * @param refs Referance array to attach with given triplet verb.
     * @returns Triplet object of the triplet created for joined entity.
     */
    async join(verb, entity, refs = undefined) {
        var _a, _b;
        let verbConcept = await SystemConcepts_1.SystemConcepts.get(verb, this.factory.getServerName());
        let i = this.triplets.findIndex(t => {
            var _a, _b, _c, _d;
            return ((_a = t.getVerb()) === null || _a === void 0 ? void 0 : _a.isEqual(verbConcept)) && ((_c = (_b = t.getJoinedEntity()) === null || _b === void 0 ? void 0 : _b.getSubject()) === null || _c === void 0 ? void 0 : _c.getId()) == ((_d = entity.getSubject()) === null || _d === void 0 ? void 0 : _d.getId());
        });
        if (i >= 0) {
            LogManager_1.LogManager.getInstance().info("adding same triplets again for entity subject - " + ((_a = this.getSubject()) === null || _a === void 0 ? void 0 : _a.getId()) + " " + ((_b = this.getFactory()) === null || _b === void 0 ? void 0 : _b.getFullName()));
            return this.triplets[i];
        }
        let t = await this.addTriplet(await SystemConcepts_1.SystemConcepts.get(verb, this.factory.getServerName()), entity.getSubject(), refs, false);
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
    async addTriplet(verb, target, refs = undefined, checkExisting = true, upsert = false) {
        if (checkExisting) {
            let i = this.triplets.findIndex(t => {
                var _a, _b;
                return ((_a = t.getVerb()) === null || _a === void 0 ? void 0 : _a.isEqual(verb)) && ((_b = t.getTarget()) === null || _b === void 0 ? void 0 : _b.isEqual(target));
            });
            if (i >= 0) {
                // LogManager.getInstance().info("adding same triplets again for entity subject - " + this.getSubject().getId() + " " + this.getFactory().getFullName())
                this.triplets[i].setUpsert(upsert);
                let existingRefs = this.getRefs();
                // Add non existing refs with current entity or replace the value for same verb
                refs === null || refs === void 0 ? void 0 : refs.forEach(r => {
                    let rIndex = existingRefs.findIndex(rI => { var _a; return (_a = rI.getIdConcept()) === null || _a === void 0 ? void 0 : _a.isEqual(r.getIdConcept()); });
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
        var _a, _b, _c, _d;
        // Check the entity triplets is_a and contained_in_file 
        let tripets1 = entity.getTriplets();
        let tripets2 = this.getTriplets();
        // Compare if they are same
        let is_a_triplet1 = tripets1.find(t => { var _a; return ((_a = t.getVerb()) === null || _a === void 0 ? void 0 : _a.getShortname()) === "is_a"; });
        let is_a_triplet2 = tripets2.find(t => { var _a; return ((_a = t.getVerb()) === null || _a === void 0 ? void 0 : _a.getShortname()) === "is_a"; });
        if (((_a = is_a_triplet1 === null || is_a_triplet1 === void 0 ? void 0 : is_a_triplet1.getTarget()) === null || _a === void 0 ? void 0 : _a.getShortname()) != ((_b = is_a_triplet2 === null || is_a_triplet2 === void 0 ? void 0 : is_a_triplet2.getTarget()) === null || _b === void 0 ? void 0 : _b.getShortname()))
            return false;
        let contained_in_file1 = tripets1.find(t => { var _a; return ((_a = t.getVerb()) === null || _a === void 0 ? void 0 : _a.getShortname()) === "contained_in_file"; });
        let contained_in_file2 = tripets2.find(t => { var _a; return ((_a = t.getVerb()) === null || _a === void 0 ? void 0 : _a.getShortname()) === "contained_in_file"; });
        if (((_c = contained_in_file1 === null || contained_in_file1 === void 0 ? void 0 : contained_in_file1.getTarget()) === null || _c === void 0 ? void 0 : _c.getShortname()) != ((_d = contained_in_file2 === null || contained_in_file2 === void 0 ? void 0 : contained_in_file2.getTarget()) === null || _d === void 0 ? void 0 : _d.getShortname()))
            return false;
        let refs1 = entity.getRefs();
        let refs2 = this.references;
        let uniqueRef1 = refs1.find(ref => { var _a; return (_a = ref.getIdConcept()) === null || _a === void 0 ? void 0 : _a.isEqual(this.uniqueRefConcept); });
        let uniqueRef2 = refs2.find(ref => { var _a; return (_a = ref.getIdConcept()) === null || _a === void 0 ? void 0 : _a.isEqual(this.uniqueRefConcept); });
        if (uniqueRef1 && uniqueRef2)
            return uniqueRef1.isEqual(uniqueRef2);
        return false;
    }
}
exports.Entity = Entity;
//# sourceMappingURL=Entity.js.map