"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityFactory = void 0;
const stream_1 = require("stream");
const DB_1 = require("../connections/DB");
const LogManager_1 = require("../loggers/LogManager");
const Concept_1 = require("../models/Concept");
const SystemConcepts_1 = require("../models/SystemConcepts");
const TemporaryId_1 = require("../utils/TemporaryId");
const Entity_1 = require("./Entity");
class EntityFactory extends stream_1.EventEmitter {
    constructor(is_a, contained_in_file, uniqueRefConcept, server = "sandra") {
        super();
        this.entityArray = [];
        this.pushedStatus = false;
        this.is_a = is_a;
        this.contained_in_file = contained_in_file;
        this.uniqueRefConcept = uniqueRefConcept;
        this.server = server;
        this.signal = false;
        this.on("abort", ((message) => { this.abort(message); }).bind(this));
    }
    abort(message) {
        this.signal = true;
    }
    /**
     *
     * @param refs Reference array list
     * @param upsert Set true if update is needed in DB for given references.
     * @returns Return new entity object if it does not exist in factory entity list, otherwise will return
     * new entity object and adds it to factory list.
    */
    async create(refs, upsert) {
        upsert = upsert || false;
        // Check if it arelady exist
        let uniqueRef1 = undefined;
        // Finding reference in array for unique concept
        if (this.uniqueRefConcept)
            uniqueRef1 = refs.find(ref => { var _a; return (_a = this.uniqueRefConcept) === null || _a === void 0 ? void 0 : _a.isEqual(ref.getIdConcept()); });
        let e = undefined;
        if (uniqueRef1)
            e = this.getEntityByRef(uniqueRef1);
        if (e) {
            e.setUpsert(upsert);
            let existingRefs = e.getRefs();
            let ts = e.getTriplets();
            let tIndex = ts.findIndex(t => { var _a; return ((_a = t.getVerb()) === null || _a === void 0 ? void 0 : _a.getShortname()) == "contained_in_file"; });
            // Add non existing refs with current entity or replace the value for same verb
            refs === null || refs === void 0 ? void 0 : refs.forEach(r => {
                let rIndex = existingRefs.findIndex(rI => { var _a; return (_a = rI.getIdConcept()) === null || _a === void 0 ? void 0 : _a.isEqual(r.getIdConcept()); });
                if (rIndex >= 0) {
                    existingRefs[rIndex].setValue(r.getValue());
                }
                else {
                    if (tIndex >= 0) {
                        r.setTripletLink(ts[tIndex]);
                        existingRefs.push(r);
                    }
                }
            });
        }
        else {
            e = new Entity_1.Entity();
            e.setUpsert(upsert);
            let subConcept = new Concept_1.Concept(TemporaryId_1.TemporaryId.create(), Concept_1.Concept.ENTITY_CONCEPT_CODE_PREFIX + this.getIsAVerb(), undefined);
            e.setFactory(this);
            e.setSubject(subConcept);
            // Set unique ref concept
            e.setUniqueRefConcept(this.uniqueRefConcept);
            // Adding is_a verb triplet
            await e.brother("is_a", this.is_a);
            // Adding contained_in_file triplet
            await e.brother("contained_in_file", this.contained_in_file, refs);
            // Adding it to the factory list
            this.entityArray.push(e);
        }
        return e;
    }
    setPushedStatus(status) { this.pushedStatus = status; }
    getEntities() { return this.entityArray; }
    getPushedStatus() { return this.pushedStatus; }
    getIsAVerb() { return this.is_a; }
    getFullName() { return this.is_a + "/" + this.contained_in_file; }
    getContainedInFileVerb() { return this.contained_in_file; }
    getUniqueRefConcept() { return this.uniqueRefConcept; }
    /**
     *
     * @param factory Factory class object to compare
     * @returns Return true if given factory verb concept and contained in file concept are same
     */
    isSame(factory) {
        return this.is_a == factory.getIsAVerb() && this.contained_in_file == factory.getContainedInFileVerb();
    }
    /**
     *
     * @param ref Reference object
     * @returns Returns the entity object of the factory containing given reference object
     */
    getEntityByRef(ref) {
        let index = this.entityArray.findIndex(e => {
            let refs1 = e.getRefs();
            if (refs1 && ref) {
                let uniqueRef1 = refs1.find(r => { var _a; return (_a = r.getIdConcept()) === null || _a === void 0 ? void 0 : _a.isEqual(ref.getIdConcept()); });
                return uniqueRef1 === null || uniqueRef1 === void 0 ? void 0 : uniqueRef1.isEqual(ref);
            }
            return false;
        });
        if (index >= 0)
            return this.entityArray[index];
        return undefined;
    }
    /**
     *
     * @param entity Entity object to look for
     * @returns Return the entity object in current with same factory and subject id
     */
    getEntity(entity) {
        if (this.uniqueRefConcept && (this.uniqueRefConcept.getShortname() || "").length > 0) {
            let index = this.entityArray.findIndex(e => e.isEqualTo(entity));
            if (index >= 0) {
                return this.entityArray[index];
            }
        }
    }
    /**
     * Resest factory by removing current entity array.
     */
    reset() {
        this.entityArray = [];
    }
    /**
     * Pushing all the entities of factory. Entities are inserted/updated one by one.
     */
    async push() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        LogManager_1.LogManager.getInstance().info("Pushing factory  - " + this.getFullName() + ", length - " + ((_a = this.entityArray) === null || _a === void 0 ? void 0 : _a.length));
        for (let index = 0; index < ((_b = this.entityArray) === null || _b === void 0 ? void 0 : _b.length); index++) {
            let entity = this.entityArray[index];
            if (entity.getPushedStatus()) {
                continue;
            }
            let sub = entity.getSubject();
            if (sub && TemporaryId_1.TemporaryId.isValid(sub.getId())) {
                // Create subject 
                await ((_c = DB_1.DB.getInstance().server(this.server)) === null || _c === void 0 ? void 0 : _c.addConcept(sub));
            }
            // Create triplets
            for (let indexTriplet = 0; indexTriplet < entity.getTriplets().length; indexTriplet++) {
                let t = entity.getTriplets()[indexTriplet];
                // Check if this is joined entity othewise push it also
                if (t.getJoinedEntity()) {
                    let factory = (_d = t.getJoinedEntity()) === null || _d === void 0 ? void 0 : _d.getFactory();
                    if (factory && !factory.getPushedStatus()) {
                        await ((_f = (_e = t.getJoinedEntity()) === null || _e === void 0 ? void 0 : _e.getFactory()) === null || _f === void 0 ? void 0 : _f.push());
                    }
                }
                if (t.isUpsert()) {
                    await ((_g = DB_1.DB.getInstance().server(this.server)) === null || _g === void 0 ? void 0 : _g.upsertTriplet(t));
                }
                else {
                    await ((_h = DB_1.DB.getInstance().server(this.server)) === null || _h === void 0 ? void 0 : _h.addTriplet(t));
                }
            }
            // Create refs
            for (let indexRef = 0; indexRef < entity.getRefs().length; indexRef++) {
                if (entity.isUpsert()) {
                    await ((_j = DB_1.DB.getInstance().server(this.server)) === null || _j === void 0 ? void 0 : _j.upsertRefs(entity.getRefs()[indexRef]));
                }
                else {
                    await ((_k = DB_1.DB.getInstance().server(this.server)) === null || _k === void 0 ? void 0 : _k.addRefs(entity.getRefs()[indexRef]));
                }
            }
            entity.setPushedStatus(true);
        }
        this.setPushedStatus(true);
        LogManager_1.LogManager.getInstance().info("Pushed factory  - " + this.getFullName());
    }
    /**
     * Pushes only references of each entity in the factory class.
     */
    async pushRefs() {
        var _a, _b, _c;
        for (let index = 0; index < ((_a = this.entityArray) === null || _a === void 0 ? void 0 : _a.length); index++) {
            let entity = this.entityArray[index];
            // Create refs
            for (let indexRef = 0; indexRef < entity.getRefs().length; indexRef++) {
                if (entity.isUpsert()) {
                    await ((_b = DB_1.DB.getInstance().server(this.server)) === null || _b === void 0 ? void 0 : _b.upsertRefs(entity.getRefs()[indexRef]));
                }
                else {
                    await ((_c = DB_1.DB.getInstance().server(this.server)) === null || _c === void 0 ? void 0 : _c.addRefs(entity.getRefs()[indexRef]));
                }
            }
        }
    }
    /**
     * Puses all triplets of each entity in the factory class.
     */
    async pushTriplets() {
        var _a, _b, _c;
        for (let index = 0; index < ((_a = this.entityArray) === null || _a === void 0 ? void 0 : _a.length); index++) {
            let entity = this.entityArray[index];
            // Create triplets
            for (let indexTriplet = 0; indexTriplet < entity.getTriplets().length; indexTriplet++) {
                let t = entity.getTriplets()[indexTriplet];
                if (t.isUpsert()) {
                    await ((_b = DB_1.DB.getInstance().server(this.server)) === null || _b === void 0 ? void 0 : _b.upsertTriplet(t));
                }
                else {
                    await ((_c = DB_1.DB.getInstance().server(this.server)) === null || _c === void 0 ? void 0 : _c.addTriplet(t));
                }
            }
        }
    }
    /**
     * Pushes all the triplets of each entity with given verb, if triplets are loaded before and
     * ignoreIfVerbExisit is set to true then it the loaded triplets will be ignored.
     * - Use case when you need to add a triplet with given verb only but also dont want
     * to add another triplet with same verb
     * @param verb
     * @param ignoreIfVerbExist
     */
    async pushTripletsBatchWithVerb(verb, ignoreIfVerbExist = false) {
        var _a;
        let triplets = [];
        for (let i = 0; i < this.entityArray.length; i++) {
            let filtered = this.entityArray[i].getTriplets().filter(t => { var _a; return (_a = t.getVerb()) === null || _a === void 0 ? void 0 : _a.isEqual(verb); });
            if ((filtered === null || filtered === void 0 ? void 0 : filtered.length) > 0) {
                if (ignoreIfVerbExist) {
                    let index = filtered.findIndex(f => { return !TemporaryId_1.TemporaryId.isValid(f.getId()); });
                    if (index < 0) {
                        triplets.push(...filtered);
                    }
                }
                else
                    triplets.push(...filtered);
            }
        }
        if (triplets.length > 0)
            await ((_a = DB_1.DB.getInstance().server(this.server)) === null || _a === void 0 ? void 0 : _a.addTripletsBatch(triplets, false));
    }
    /**
     * Pushes entity list of the facotry class object in batch.
     * In case there are too many enities are to be added this can be used to minimize query insertion time.
     * It also ignore all the entities that have pushed status set to true, pushed status is set after loading
     * factory class entities. Its set to true if the entity is already present in db.
     */
    async pushBatch() {
        var _a, _b, _c, _d, _e, _f;
        LogManager_1.LogManager.getInstance().info("Pushing factory  batch - " + this.getFullName() + ", length - " + ((_a = this.entityArray) === null || _a === void 0 ? void 0 : _a.length));
        let newEntities = this.entityArray.filter(e => {
            let sub = e.getSubject();
            if (sub && TemporaryId_1.TemporaryId.isValid(sub.getId())) {
                return e;
            }
        });
        let newConcepts = newEntities.map(e => {
            let sub = e.getSubject();
            if (sub) {
                return sub;
            }
            else
                throw new Error("Undefined subject object in push batch");
        });
        if ((newConcepts === null || newConcepts === void 0 ? void 0 : newConcepts.length) > 0) {
            let newTriplets = [];
            newEntities.forEach(e => {
                newTriplets = [...newTriplets, ...e.getTriplets()];
            });
            let newRefs = [];
            newEntities.forEach(e => {
                newRefs = [...newRefs, ...e.getRefs()];
            });
            await ((_b = DB_1.DB.getInstance().server(this.server)) === null || _b === void 0 ? void 0 : _b.beginTransaction());
            if (newConcepts.length > 0)
                await ((_c = DB_1.DB.getInstance().server(this.server)) === null || _c === void 0 ? void 0 : _c.addConceptsBatch(newConcepts));
            if (newTriplets.length > 0)
                await ((_d = DB_1.DB.getInstance().server(this.server)) === null || _d === void 0 ? void 0 : _d.addTripletsBatch(newTriplets, false, false));
            if (newRefs.length > 0)
                await ((_e = DB_1.DB.getInstance().server(this.server)) === null || _e === void 0 ? void 0 : _e.addReferencesBatch(newRefs, false));
            await ((_f = DB_1.DB.getInstance().server(this.server)) === null || _f === void 0 ? void 0 : _f.commit());
            LogManager_1.LogManager.getInstance().info("Pushed factory batch - " + this.getFullName());
        }
        else {
            LogManager_1.LogManager.getInstance().info("No new entity to push.. - " + this.getFullName());
        }
    }
    /**
     * Pushes references of all the entities of given facotry in batch call.
     */
    async pushRefsBatch() {
        var _a;
        let refs = [];
        for (let i = 0; i < this.entityArray.length; i++) {
            refs.push(...this.entityArray[i].getRefs());
        }
        await ((_a = DB_1.DB.getInstance().server(this.server)) === null || _a === void 0 ? void 0 : _a.addReferencesBatch(refs));
    }
    /**
     * Pushes triplets of all the entities of given facotry in batch call.
     */
    async pushTripletsBatch() {
        var _a;
        let triplets = [];
        for (let i = 0; i < this.entityArray.length; i++) {
            triplets.push(...this.entityArray[i].getTriplets());
        }
        await ((_a = DB_1.DB.getInstance().server(this.server)) === null || _a === void 0 ? void 0 : _a.addTripletsBatch(triplets, false));
    }
    /**
     * Updates reference in DB of all the entities of a factory with given concept
     * @param conceptId
     */
    async batchRefUpdate(concept) {
        var _a;
        let refs = [];
        this.entityArray.forEach(e => {
            let r = e.getRefs().filter(r => { var _a; return (_a = r.getIdConcept()) === null || _a === void 0 ? void 0 : _a.isEqual(concept); });
            if (r)
                refs.push(...r);
        });
        await ((_a = DB_1.DB.getInstance().server(this.server)) === null || _a === void 0 ? void 0 : _a.updateRefsBatchById(refs));
    }
    /**
     * Udpates all the triplet where triplet upsert is true of all the entities of the factory object.
     */
    async upsertTripletsBatch() {
        var _a;
        let triplets = [];
        for (let i = 0; i < this.entityArray.length; i++) {
            triplets.push(...this.entityArray[i].getTriplets().filter(t => { return t.isUpsert(); }));
        }
        await ((_a = DB_1.DB.getInstance().server(this.server)) === null || _a === void 0 ? void 0 : _a.updateTripletsBatchById(triplets));
    }
    /**
        * Loads all the entities with given reference of the factory object.
        * @param ref Referance object to search for.
        * @param loadAllEntityData If true then all references and triplets are also loaded, if false only subject concept is loaded
        * @param iterateDown If true then all the joined entities are also loaded.
        * @param limit limits the number of result.
        
    */
    async load(ref, loadAllEntityData = true, iterateDown = false, limit = 1000) {
        var _a, _b, _c;
        let entityTriplets = await ((_a = DB_1.DB.getInstance().server(this.server)) === null || _a === void 0 ? void 0 : _a.getEntityTriplet(await SystemConcepts_1.SystemConcepts.get("contained_in_file"), await SystemConcepts_1.SystemConcepts.get(this.contained_in_file), ref, limit));
        for (let index = 0; index < (entityTriplets === null || entityTriplets === void 0 ? void 0 : entityTriplets.length); index++) {
            let entityTriplet = entityTriplets[index];
            let refs = [];
            let triplets = [];
            if (loadAllEntityData) {
                triplets = await ((_b = DB_1.DB.getInstance().server(this.server)) === null || _b === void 0 ? void 0 : _b.getTripletsBySubject(entityTriplet.getSubject()));
                for (let i = 0; i < triplets.length; i++) {
                    if (iterateDown) {
                        let e = await this.loadBySubject(triplets[i].getTarget(), true);
                        if (e) {
                            triplets[i].setJoinedEntity(e);
                        }
                    }
                    let r = await ((_c = DB_1.DB.getInstance().server(this.server)) === null || _c === void 0 ? void 0 : _c.getReferenceByTriplet(triplets[i]));
                    refs.push(...r);
                }
            }
            let e = new Entity_1.Entity();
            let subject = entityTriplet.getSubject();
            if (subject)
                e.setSubject(subject);
            e.setPushedStatus(true);
            if (loadAllEntityData)
                e.getTriplets().push(...triplets);
            else
                e.getTriplets().push(entityTriplet);
            e.getRefs().push(...refs);
            e.setUniqueRefConcept(this.uniqueRefConcept);
            this.entityArray.push(e);
        }
    }
    /**
     *
     * @param subject Subject concept object to load
     * @param iterateDown If set true all the joined entities are also loaded
     * @returns Return entity object from the DB with given subject concept. Checks the subject id to load data.
     * It does not add loaded entity to current factory entity list.
     */
    async loadBySubject(subject, iterateDown = false) {
        var _a, _b, _c;
        let entityConcept = await ((_a = DB_1.DB.getInstance().server(this.server)) === null || _a === void 0 ? void 0 : _a.getConceptById(Number(subject === null || subject === void 0 ? void 0 : subject.getId())));
        if (entityConcept) {
            // Get all the triplets for this entity 
            let triplets = await ((_b = DB_1.DB.getInstance().server(this.server)) === null || _b === void 0 ? void 0 : _b.getTripletsBySubject(entityConcept));
            let refs = [];
            for (let i = 0; i < triplets.length; i++) {
                if (iterateDown) {
                    let e = await this.loadBySubject(triplets[i].getTarget(), true);
                    if (e) {
                        triplets[i].setJoinedEntity(e);
                    }
                }
                let r = await ((_c = DB_1.DB.getInstance().server(this.server)) === null || _c === void 0 ? void 0 : _c.getReferenceByTriplet(triplets[i]));
                refs.push(...r);
            }
            let e = new Entity_1.Entity();
            if (subject)
                e.setSubject(subject);
            e.getTriplets().push(...triplets);
            e.getRefs().push(...refs);
            return e;
        }
        return null;
    }
    /**
     *
     * @param triplets Triplets to serach
     * @param refs References to search, these references should also have tripletlink set. And this triplet should be added to triplets array parameter
     * @param limit Number of records to select.
     */
    async filter(triplets, refs, limit) {
        var _a;
        let concepts = await ((_a = DB_1.DB.getInstance().server(this.server)) === null || _a === void 0 ? void 0 : _a.filter(triplets, refs, limit, { abortSignal: this }));
        concepts.forEach((val, key) => {
            if (this.signal)
                throw Error("Abort signal recieved");
            let e = new Entity_1.Entity();
            e.setSubject(key);
            e.getTriplets().push(...val);
            e.setPushedStatus(true);
            e.setUniqueRefConcept(this.uniqueRefConcept);
            this.entityArray.push(e);
        });
    }
    /**
     * Loads last entities into factory list from the database with is_a and contained_in_file verbs of current factory class object.
     * @param lastId Subject id of the first entity, it will load all entities with subject ids less that given id.
     * Used for pagingation.
     * @param limit Limit the number of records
     */
    async loadEntityConcepts(lastId, limit) {
        var _a;
        let cifFileTargetSub = await SystemConcepts_1.SystemConcepts.get(this.getContainedInFileVerb());
        let cifFileVerbSub = await SystemConcepts_1.SystemConcepts.get("contained_in_file");
        let entityConcepts = await ((_a = DB_1.DB.getInstance().server(this.server)) === null || _a === void 0 ? void 0 : _a.getEntityConcepts(cifFileVerbSub, cifFileTargetSub, lastId, limit));
        for (let index = 0; index < (entityConcepts === null || entityConcepts === void 0 ? void 0 : entityConcepts.length); index++) {
            let entityConcept = entityConcepts[index];
            let e = new Entity_1.Entity();
            e.setSubject(entityConcept);
            e.setUniqueRefConcept(this.uniqueRefConcept);
            this.entityArray.push(e);
        }
    }
    /**
     * Loads the references of all entites of given factory
     */
    async loadEntityConceptsRefs() {
        var _a;
        let cifSystem = await SystemConcepts_1.SystemConcepts.get("contained_in_file");
        await ((_a = DB_1.DB.getInstance().server(this.server)) === null || _a === void 0 ? void 0 : _a.getEntityConceptsRefs(this.entityArray, cifSystem));
    }
    /***
     * Loading all the triplets of given factrory entities
     *
    */
    async loadTriplets(loadVerbData = false) {
        var _a, _b;
        if (((_a = this.entityArray) === null || _a === void 0 ? void 0 : _a.length) == 0)
            return;
        let s = [];
        this.entityArray.forEach(e => {
            let sub = e.getSubject();
            if (sub)
                s.push(sub);
        });
        let triplets = await ((_b = DB_1.DB.getInstance().server(this.server)) === null || _b === void 0 ? void 0 : _b.getTriplets(s, undefined, loadVerbData));
        this.entityArray.forEach(e => {
            var _a;
            let subId = (_a = e.getSubject()) === null || _a === void 0 ? void 0 : _a.getId();
            let trps = triplets.filter(t => { var _a; return ((_a = t.getSubject()) === null || _a === void 0 ? void 0 : _a.getId()) == subId; });
            trps.forEach(t => {
                var _a;
                let triplet = (_a = e.getTriplets()) === null || _a === void 0 ? void 0 : _a.find(tr => {
                    var _a, _b, _c, _d;
                    return ((_a = tr.getVerb()) === null || _a === void 0 ? void 0 : _a.getId()) == ((_b = t.getVerb()) === null || _b === void 0 ? void 0 : _b.getId()) &&
                        ((_c = tr.getTarget()) === null || _c === void 0 ? void 0 : _c.getId()) == ((_d = t.getTarget()) === null || _d === void 0 ? void 0 : _d.getId());
                });
                if (triplet) {
                    triplet.setId(t.getId());
                }
                else {
                    e.getTriplets().push(t);
                }
            });
        });
    }
    /**
     * Loads only the triplets with given verb for each entity of the factory from the database.
     * @param verb Verb concept of triplets to load.
     * @param loadVerbData - It will also loads verb concpet of the given verb.
     */
    async loadTripletsWithVerb(verb, loadVerbData = false) {
        var _a;
        let s = [];
        this.entityArray.forEach(e => {
            let sub = e.getSubject();
            if (sub)
                s.push(sub);
        });
        let triplets = await ((_a = DB_1.DB.getInstance().server(this.server)) === null || _a === void 0 ? void 0 : _a.getTriplets(s, [verb], loadVerbData));
        this.entityArray.forEach(e => {
            var _a;
            let subId = (_a = e.getSubject()) === null || _a === void 0 ? void 0 : _a.getId();
            let trps = triplets.filter(t => { var _a; return ((_a = t.getSubject()) === null || _a === void 0 ? void 0 : _a.getId()) == subId; });
            trps.forEach(t => {
                var _a;
                let triplet = (_a = e.getTriplets()) === null || _a === void 0 ? void 0 : _a.find(tr => {
                    var _a, _b, _c, _d;
                    return ((_a = tr.getVerb()) === null || _a === void 0 ? void 0 : _a.getId()) == ((_b = t.getVerb()) === null || _b === void 0 ? void 0 : _b.getId()) &&
                        ((_c = tr.getTarget()) === null || _c === void 0 ? void 0 : _c.getId()) == ((_d = t.getTarget()) === null || _d === void 0 ? void 0 : _d.getId());
                });
                if (triplet)
                    triplet.setId(t.getId());
                else {
                    e.getTriplets().push(t);
                }
            });
        });
    }
    /**
     *
     * @returns Loads all the subject concept of each entity of current facotry object.
     * Function will look for the entity in the database accroding the unique ref concpet/value and updates them
     * in current entity list.
     */
    async loadAllSubjects() {
        var _a;
        if (this.entityArray.length == 0)
            return;
        let refs = [];
        this.entityArray.forEach(entity => {
            let r = entity.getRef(this.uniqueRefConcept);
            if (r)
                refs.push(r.getValue());
        });
        let entityConceptsMap = await ((_a = DB_1.DB.getInstance().server(this.server)) === null || _a === void 0 ? void 0 : _a.getEntityConceptsByRefs(await SystemConcepts_1.SystemConcepts.get("contained_in_file"), await SystemConcepts_1.SystemConcepts.get(this.contained_in_file), refs, this.uniqueRefConcept));
        this.entityArray.forEach(entity => {
            let r = entity.getRef(this.uniqueRefConcept);
            if (r) {
                let loadedS = entityConceptsMap.get(r.getValue().toString());
                if (loadedS) {
                    if (!entity.isUpsert())
                        entity.setPushedStatus(true);
                    let s = entity.getSubject();
                    if (s) {
                        s.setId(loadedS.getId());
                        s.setCode(loadedS.getCode());
                        s.setShortname(loadedS.getShortname());
                    }
                    else {
                        let s = entityConceptsMap.get(r.getValue());
                        if (s)
                            entity.setSubject(s);
                    }
                }
            }
        });
    }
    /**
     * Loads all the references of each triplets of all the entities of current factory class object.
     */
    async loadAllTripletRefs(refConcept) {
        var _a, _b, _c, _d;
        let ts = [];
        if (((_a = this.entityArray) === null || _a === void 0 ? void 0 : _a.length) == 0)
            return;
        (_b = this.entityArray) === null || _b === void 0 ? void 0 : _b.map(e => { ts = [...ts, ...e.getTriplets()]; });
        let refs = await ((_c = DB_1.DB.getInstance().server(this.server)) === null || _c === void 0 ? void 0 : _c.getReferenceByTriplets(ts));
        for (let i = 0; i < ((_d = this.entityArray) === null || _d === void 0 ? void 0 : _d.length); i++) {
            let e = this.entityArray[i];
            let triplets = e.getTriplets();
            triplets.forEach(t => {
                let refBatch = refs.filter(r => { var _a; return ((_a = r.getTripletLink()) === null || _a === void 0 ? void 0 : _a.getId()) == t.getId(); });
                if (refBatch && refBatch.length > 0) {
                    let existingRefs = e.getRefs();
                    refBatch === null || refBatch === void 0 ? void 0 : refBatch.forEach(r => {
                        let a = existingRefs.find(rf => { var _a, _b, _c, _d; return ((_a = rf.getIdConcept()) === null || _a === void 0 ? void 0 : _a.getId()) == ((_b = r.getIdConcept()) === null || _b === void 0 ? void 0 : _b.getId()) && ((_c = rf.getTripletLink()) === null || _c === void 0 ? void 0 : _c.getId()) == ((_d = r.getTripletLink()) === null || _d === void 0 ? void 0 : _d.getId()); });
                        if (a) {
                            a.setId(r.getId());
                        }
                        else {
                            r.setTripletLink(t);
                            e.getRefs().push(r);
                        }
                    });
                }
            });
        }
    }
    /**
     * Adds a new entity into factory list with given subject concept.
     * @param subject
     * @returns
     */
    async addSubjectAsEntity(subject) {
        let i = this.entityArray.findIndex(e => { var _a; return (_a = e.getSubject()) === null || _a === void 0 ? void 0 : _a.isEqual(subject); });
        if (i >= 0)
            return;
        let e = new Entity_1.Entity();
        e.setSubject(subject);
        this.entityArray.push(e);
    }
}
exports.EntityFactory = EntityFactory;
//# sourceMappingURL=EntityFactory.js.map