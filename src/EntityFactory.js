"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityFactory = void 0;
const stream_1 = require("stream");
const Concept_1 = require("./Concept");
const DBAdapter_1 = require("./DBAdapter");
const Entity_1 = require("./Entity");
const LogManager_1 = require("./loggers/LogManager");
const SystemConcepts_1 = require("./SystemConcepts");
const TemporaryId_1 = require("./TemporaryId");
class EntityFactory extends stream_1.EventEmitter {
    constructor(is_a, contained_in_file, uniqueRefConcept) {
        super();
        this.entityArray = [];
        this.pushedStatus = false;
        this.is_a = is_a;
        this.contained_in_file = contained_in_file;
        this.uniqueRefConcept = uniqueRefConcept;
        this.abortSignal = false;
    }
    abort(reason) {
        this.abortSignal = true;
        this.emit("abort", reason);
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
                let uniqueRef1 = refs1.find(r => { var _a; return (_a = r.getIdConcept()) === null || _a === void 0 ? void 0 : _a.isSame(ref.getIdConcept()); });
                return uniqueRef1.isEqualTo(ref);
            }
            return false;
        });
        if (index >= 0)
            return this.entityArray[index];
        return null;
    }
    /**
     *
     * @param entity Entity object to look for
     * @returns Return the entity object in current with same factory and subject id
     */
    getEntity(entity) {
        if (this.uniqueRefConcept && this.uniqueRefConcept.getShortname().length > 0) {
            let index = this.entityArray.findIndex(e => e.isEqualTo(entity));
            if (index >= 0) {
                return this.entityArray[index];
            }
        }
    }
    /**
     *
     * @param refs Reference array list
     * @param upsert Set true if update is needed in DB for given references.
     * @returns Return new entity object if it does not exist in factory entity list, otherwise will return
     * new entity object and adds it to factory list.
    */
    async create(refs, upsert = false) {
        // Check if it arelady exist
        let uniqueRef1 = null;
        // Finding reference in array for unique concept
        if (this.uniqueRefConcept)
            uniqueRef1 = refs.find(ref => { var _a; return (_a = this.uniqueRefConcept) === null || _a === void 0 ? void 0 : _a.isSame(ref.getIdConcept()); });
        let e = this.getEntityByRef(uniqueRef1);
        if (e) {
            e.setUpsert(upsert);
            let existingRefs = e.getRefs();
            let ts = e.getTriplets();
            let tIndex = ts.findIndex(t => { return t.getVerb().getShortname() == "contained_in_file"; });
            // Add non existing refs with current entity or replace the value for same verb
            refs === null || refs === void 0 ? void 0 : refs.forEach(r => {
                let rIndex = existingRefs.findIndex(rI => { return rI.getIdConcept().isSame(r.getIdConcept()); });
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
            let subConcept = new Concept_1.Concept(TemporaryId_1.TemporaryId.create(), Concept_1.Concept.ENTITY_CONCEPT_CODE_PREFIX + this.getIsAVerb(), null);
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
        var _a, _b, _c;
        LogManager_1.LogManager.getInstance().info("Pushing factory  - " + this.getFullName() + ", length - " + ((_a = this.entityArray) === null || _a === void 0 ? void 0 : _a.length));
        for (let index = 0; index < ((_b = this.entityArray) === null || _b === void 0 ? void 0 : _b.length); index++) {
            let entity = this.entityArray[index];
            if (entity.getPushedStatus()) {
                continue;
            }
            if (TemporaryId_1.TemporaryId.isValid(entity.getSubject().getId())) {
                // Create subject 
                await (await DBAdapter_1.DBAdapter.getInstance()).addConcept(entity.getSubject());
            }
            // Create triplets
            for (let indexTriplet = 0; indexTriplet < entity.getTriplets().length; indexTriplet++) {
                let t = entity.getTriplets()[indexTriplet];
                // Check if this is joined entity othewise push it also
                if (t.getJoinedEntity()) {
                    let factory = t.getJoinedEntity().getFactory();
                    if (factory && !factory.getPushedStatus()) {
                        await ((_c = t.getJoinedEntity().getFactory()) === null || _c === void 0 ? void 0 : _c.push());
                    }
                }
                if (t.isUpsert()) {
                    await (await DBAdapter_1.DBAdapter.getInstance()).upsertTriplet(t);
                }
                else {
                    await (await DBAdapter_1.DBAdapter.getInstance()).addTriplet(t);
                }
                if (t.getStorage()) {
                    await (await DBAdapter_1.DBAdapter.getInstance()).addDataStorage(t);
                }
            }
            // Create refs
            for (let indexRef = 0; indexRef < entity.getRefs().length; indexRef++) {
                if (entity.isUpsert()) {
                    await (await DBAdapter_1.DBAdapter.getInstance()).upsertRefs(entity.getRefs()[indexRef]);
                }
                else {
                    await (await DBAdapter_1.DBAdapter.getInstance()).addRefs(entity.getRefs()[indexRef]);
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
        var _a;
        for (let index = 0; index < ((_a = this.entityArray) === null || _a === void 0 ? void 0 : _a.length); index++) {
            let entity = this.entityArray[index];
            // Create refs
            for (let indexRef = 0; indexRef < entity.getRefs().length; indexRef++) {
                if (entity.isUpsert()) {
                    await (await DBAdapter_1.DBAdapter.getInstance()).upsertRefs(entity.getRefs()[indexRef]);
                }
                else {
                    await (await DBAdapter_1.DBAdapter.getInstance()).addRefs(entity.getRefs()[indexRef]);
                }
            }
        }
    }
    /**
     * Puses all triplets of each entity in the factory class.
     */
    async pushTriplets() {
        var _a;
        for (let index = 0; index < ((_a = this.entityArray) === null || _a === void 0 ? void 0 : _a.length); index++) {
            let entity = this.entityArray[index];
            // Create triplets
            for (let indexTriplet = 0; indexTriplet < entity.getTriplets().length; indexTriplet++) {
                let t = entity.getTriplets()[indexTriplet];
                if (t.isUpsert()) {
                    await (await DBAdapter_1.DBAdapter.getInstance()).upsertTriplet(t);
                }
                else {
                    await (await DBAdapter_1.DBAdapter.getInstance()).addTriplet(t);
                }
                if (t.getStorage()) {
                    await (await DBAdapter_1.DBAdapter.getInstance()).addDataStorage(t);
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
        let triplets = [];
        for (let i = 0; i < this.entityArray.length; i++) {
            let filtered = this.entityArray[i].getTriplets().filter(t => t.getVerb().isSame(verb));
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
            await (await DBAdapter_1.DBAdapter.getInstance()).addTripletsBatch(triplets, false);
    }
    /**
     * Pushes entity list of the facotry class object in batch.
     * In case there are too many enities are to be added this can be used to minimize query insertion time.
     * It also ignore all the entities that have pushed status set to true, pushed status is set after loading
     * factory class entities. Its set to true if the entity is already present in db.
     */
    async pushBatch() {
        var _a;
        LogManager_1.LogManager.getInstance().info("Pushing factory  batch - " + this.getFullName() + ", length - " + ((_a = this.entityArray) === null || _a === void 0 ? void 0 : _a.length));
        let concepts = [];
        let triplets = [];
        let references = [];
        let newEntities = this.entityArray.filter(e => {
            if (TemporaryId_1.TemporaryId.isValid(e.getSubject().getId())) {
                return e;
            }
        });
        let newConcepts = newEntities.map(e => {
            return e.getSubject();
        });
        if ((newConcepts === null || newConcepts === void 0 ? void 0 : newConcepts.length) > 0) {
            let newTriplets = [];
            newEntities.forEach(e => {
                newTriplets = [...newTriplets, ...e.getTriplets()];
            });
            let newRef = [];
            newEntities.forEach(e => {
                newRef = [...newRef, ...e.getRefs()];
            });
            let totalNewConc = newConcepts === null || newConcepts === void 0 ? void 0 : newConcepts.length;
            let totalNewTrips = newTriplets === null || newTriplets === void 0 ? void 0 : newTriplets.length;
            let lastConceptToAdd = newConcepts[newConcepts.length - 1];
            let lastTipletToAdd;
            let maxTripletId = -1;
            if (newTriplets.length > 0)
                lastTipletToAdd = newTriplets[newTriplets.length - 1];
            // Inserting and getting max ids 
            await (await DBAdapter_1.DBAdapter.getInstance()).lockTables(true, false, false);
            let maxConceptId = await (await DBAdapter_1.DBAdapter.getInstance()).getMaxConceptId();
            lastConceptToAdd.setId(String(Number(maxConceptId) + totalNewConc));
            await (await DBAdapter_1.DBAdapter.getInstance()).addConcept(lastConceptToAdd, true);
            await (await DBAdapter_1.DBAdapter.getInstance()).unlockTable();
            if (lastTipletToAdd) {
                await (await DBAdapter_1.DBAdapter.getInstance()).lockTables(false, true, false);
                maxTripletId = await (await DBAdapter_1.DBAdapter.getInstance()).getMaxTripletId();
                lastTipletToAdd.setId(String(Number(maxTripletId) + totalNewTrips));
                await (await DBAdapter_1.DBAdapter.getInstance()).addTriplet(lastTipletToAdd, true);
                await (await DBAdapter_1.DBAdapter.getInstance()).unlockTable();
            }
            // Add till second last because last id was already added
            for (let i = 0; i <= newConcepts.length - 2; i++) {
                maxConceptId = maxConceptId + 1;
                let c = newConcepts[i];
                c.setId(maxConceptId);
                concepts.push(c);
            }
            for (let i = 0; i <= newTriplets.length - 2; i++) {
                maxTripletId = maxTripletId + 1;
                let t = newTriplets[i];
                t.setId(maxTripletId);
                triplets.push(t);
            }
            for (let i = 0; i <= newRef.length - 1; i++) {
                references.push(newRef[i]);
            }
            await (await DBAdapter_1.DBAdapter.getInstance()).beginTransaction();
            if (concepts.length > 0)
                await (await DBAdapter_1.DBAdapter.getInstance()).addConceptsBatch(concepts);
            if (triplets.length > 0)
                await (await DBAdapter_1.DBAdapter.getInstance()).addTripletsBatch(triplets);
            if (references.length > 0)
                await (await DBAdapter_1.DBAdapter.getInstance()).addReferencesBatch(references, false);
            await (await DBAdapter_1.DBAdapter.getInstance()).commit();
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
        let refs = [];
        for (let i = 0; i < this.entityArray.length; i++) {
            refs.push(...this.entityArray[i].getRefs());
        }
        await (await DBAdapter_1.DBAdapter.getInstance()).addReferencesBatch(refs);
    }
    /**
     * Pushes triplets of all the entities of given facotry in batch call.
     */
    async pushTripletsBatch() {
        let triplets = [];
        for (let i = 0; i < this.entityArray.length; i++) {
            triplets.push(...this.entityArray[i].getTriplets());
        }
        await (await DBAdapter_1.DBAdapter.getInstance()).addTripletsBatch(triplets, false);
    }
    /**
     * Updates reference in DB of all the entities of a factory with given concept
     * @param conceptId
     */
    async batchRefUpdate(concept) {
        let refs = [];
        this.entityArray.forEach(e => {
            let r = e.getRefs().filter(r => { return r.getIdConcept().isSame(concept); });
            if (r)
                refs.push(...r);
        });
        await (await DBAdapter_1.DBAdapter.getInstance()).updateRefsBatchById(refs);
    }
    /**
     * Udpates all the triplet where triplet upsert is true of all the entities of the factory object.
     */
    async upsertTripletsBatch() {
        let triplets = [];
        for (let i = 0; i < this.entityArray.length; i++) {
            triplets.push(...this.entityArray[i].getTriplets().filter(t => { return t.isUpsert(); }));
        }
        await (await DBAdapter_1.DBAdapter.getInstance()).updateTripletsBatchById(triplets);
    }
    /**
        * Loads all the entities with given reference of the factory object.
        * @param ref Referance object to search for.
        * @param loadAllEntityData If true then all references and triplets are also loaded, if false only subject concept is loaded
        * @param iterateDown If true then all the joined entities are also loaded.
        * @param limit limits the number of result.
        
    */
    async load(ref, loadAllEntityData = true, iterateDown = false, limit = 1000) {
        let entityTriplets = await (await DBAdapter_1.DBAdapter.getInstance()).getEntityTriplet(await SystemConcepts_1.SystemConcepts.get("contained_in_file"), await SystemConcepts_1.SystemConcepts.get(this.contained_in_file), ref, limit, this);
        for (let index = 0; index < (entityTriplets === null || entityTriplets === void 0 ? void 0 : entityTriplets.length); index++) {
            if (this.abortSignal)
                throw new Error("Abort called!!");
            let entityTriplet = entityTriplets[index];
            let refs = [];
            let triplets = [];
            if (loadAllEntityData) {
                triplets = await (await DBAdapter_1.DBAdapter.getInstance()).getTripletsBySubject(entityTriplet.getSubject());
                for (let i = 0; i < triplets.length; i++) {
                    if (this.abortSignal)
                        throw new Error("Abort called!!");
                    if (iterateDown) {
                        let e = await this.loadBySubject(triplets[i].getTarget(), true);
                        if (e) {
                            triplets[i].setJoinedEntity(e);
                        }
                    }
                    let r = await (await DBAdapter_1.DBAdapter.getInstance()).getReferenceByTriplet(triplets[i]);
                    // Load storage data for triplet
                    await (await DBAdapter_1.DBAdapter.getInstance()).getDataStorageByTriplet(triplets[i]);
                    refs.push(...r);
                }
            }
            let e = new Entity_1.Entity();
            e.setSubject(entityTriplet.getSubject());
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
        let entityConcept = await (await DBAdapter_1.DBAdapter.getInstance()).getConceptById(Number(subject.getId()));
        if (entityConcept) {
            // Get all the triplets for this entity 
            let triplets = await (await DBAdapter_1.DBAdapter.getInstance()).getTripletsBySubject(entityConcept);
            let refs = [];
            for (let i = 0; i < triplets.length; i++) {
                if (iterateDown) {
                    let e = await this.loadBySubject(triplets[i].getTarget(), true);
                    if (e) {
                        triplets[i].setJoinedEntity(e);
                    }
                }
                let r = await (await DBAdapter_1.DBAdapter.getInstance()).getReferenceByTriplet(triplets[i]);
                refs.push(...r);
            }
            let e = new Entity_1.Entity();
            e.setSubject(subject);
            e.getTriplets().push(...triplets);
            e.getRefs().push(...refs);
            return e;
        }
        return null;
    }
    /**
     * Loads all the entities with given triplets. Selection is on current factory class is_a and cointain_in_file verbs.
     * @param triplets
     * @param limit
     */
    async loadByTriplet(triplets, limit) {
        let concepts = await (await DBAdapter_1.DBAdapter.getInstance()).getEntitiesByTriplet(triplets, limit);
        concepts.forEach((val, key) => {
            let e = new Entity_1.Entity();
            e.setSubject(key);
            e.getTriplets().push(...val);
            e.setPushedStatus(true);
            e.setUniqueRefConcept(this.uniqueRefConcept);
            this.entityArray.push(e);
        });
    }
    /**
     *
     * @param triplets Triplets to serach
     * @param refs References to search, these references should also have tripletlink set. And this triplet should be added to triplets array parameter
     * @param limit Number of records to select.
     */
    async filter(triplets, refs, limit) {
        let concepts = await (await DBAdapter_1.DBAdapter.getInstance()).filter(triplets, refs, limit, this);
        concepts.forEach((val, key) => {
            if (this.abortSignal)
                throw new Error("Abort called!!");
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
        let entityConcepts = await (await DBAdapter_1.DBAdapter.getInstance()).getEntityConcepts(this.is_a, lastId, limit);
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
        await (await DBAdapter_1.DBAdapter.getInstance()).getEntityConceptsRefs(this.entityArray, await SystemConcepts_1.SystemConcepts.get("contained_in_file"));
    }
    // Loading all the triplets of given factrory entities 
    async loadTriplets(loadVerbData = false) {
        var _a;
        if (((_a = this.entityArray) === null || _a === void 0 ? void 0 : _a.length) == 0)
            return;
        let s = [];
        this.entityArray.forEach(e => {
            s.push(e.getSubject());
        });
        let triplets = await (await DBAdapter_1.DBAdapter.getInstance()).getTriplets(s, null, loadVerbData);
        this.entityArray.forEach(e => {
            let subId = e.getSubject().getId();
            let trps = triplets.filter(t => t.getSubject().getId() == subId);
            trps.forEach(t => {
                var _a;
                let triplet = (_a = e.getTriplets()) === null || _a === void 0 ? void 0 : _a.find(tr => tr.getVerb().getId() == t.getVerb().getId() &&
                    tr.getTarget().getId() == t.getTarget().getId());
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
        let s = [];
        this.entityArray.forEach(e => {
            s.push(e.getSubject());
        });
        let triplets = await (await DBAdapter_1.DBAdapter.getInstance()).getTriplets(s, [verb], loadVerbData);
        this.entityArray.forEach(e => {
            let subId = e.getSubject().getId();
            let trps = triplets.filter(t => t.getSubject().getId() == subId);
            trps.forEach(t => {
                var _a;
                let triplet = (_a = e.getTriplets()) === null || _a === void 0 ? void 0 : _a.find(tr => tr.getVerb().getId() == t.getVerb().getId() &&
                    tr.getTarget().getId() == t.getTarget().getId());
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
        if (this.entityArray.length == 0)
            return;
        let refs = this.entityArray.map(entity => {
            let r = entity.getRef(this.uniqueRefConcept);
            if (r)
                return r.getValue();
        });
        let entityConceptsMap = await (await DBAdapter_1.DBAdapter.getInstance()).getEntityConceptsByRefs(await SystemConcepts_1.SystemConcepts.get("contained_in_file"), await SystemConcepts_1.SystemConcepts.get(this.contained_in_file), refs, this.uniqueRefConcept);
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
                    else
                        entity.setSubject(entityConceptsMap.get(r.getValue()));
                }
            }
        });
    }
    /**
     * Loads all the references of each triplets of all the entities of current factory class object.
     */
    async loadAllTripletRefs(refConcept = null) {
        var _a, _b, _c;
        let ts = [];
        if (((_a = this.entityArray) === null || _a === void 0 ? void 0 : _a.length) == 0)
            return;
        (_b = this.entityArray) === null || _b === void 0 ? void 0 : _b.map(e => { ts = [...ts, ...e.getTriplets()]; });
        let refs = await (await DBAdapter_1.DBAdapter.getInstance()).getReferenceByTriplets(ts);
        for (let i = 0; i < ((_c = this.entityArray) === null || _c === void 0 ? void 0 : _c.length); i++) {
            let e = this.entityArray[i];
            let triplets = e.getTriplets();
            triplets.forEach(t => {
                let refBatch = refs.filter(r => { return r.getTripletLink().getId() == t.getId(); });
                if (refBatch && refBatch.length > 0) {
                    let existingRefs = e.getRefs();
                    refBatch === null || refBatch === void 0 ? void 0 : refBatch.forEach(r => {
                        let a = existingRefs.find(rf => rf.getIdConcept().getId() == r.getIdConcept().getId() && rf.getTripletLink().getId() == r.getTripletLink().getId());
                        if (a) {
                            a.setId(r.getId());
                        }
                        else {
                            r.setTripletLink(t);
                            e.getRefs().push(r);
                        }
                    });
                    //e.getRefs().push(...refBatch);
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
        let i = this.entityArray.findIndex(e => { return e.getSubject().isSame(subject); });
        if (i >= 0)
            return;
        let e = new Entity_1.Entity();
        e.setSubject(subject);
        this.entityArray.push(e);
    }
}
exports.EntityFactory = EntityFactory;
//# sourceMappingURL=EntityFactory.js.map