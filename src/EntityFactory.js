"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityFactory = void 0;
const Concept_1 = require("./Concept");
const DBAdapter_1 = require("./DBAdapter");
const Entity_1 = require("./Entity");
const LogManager_1 = require("./loggers/LogManager");
const SystemConcepts_1 = require("./SystemConcepts");
const TemporaryId_1 = require("./TemporaryId");
class EntityFactory {
    constructor(is_a, contained_in_file, uniqueRefConcept) {
        this.entityArray = [];
        this.pushedStatus = false;
        this.is_a = is_a;
        this.contained_in_file = contained_in_file;
        this.uniqueRefConcept = uniqueRefConcept;
    }
    getEntities() { return this.entityArray; }
    getPushedStatus() { return this.pushedStatus; }
    setPushedStatus(status) { this.pushedStatus = status; }
    getIsAVerb() {
        return this.is_a;
    }
    getFullName() {
        return this.is_a + "/" + this.contained_in_file;
    }
    getContainedInFileVerb() {
        return this.contained_in_file;
    }
    isSame(factory) {
        return this.is_a == factory.getIsAVerb() && this.contained_in_file == factory.getContainedInFileVerb();
    }
    getUniqueRefConcept() {
        return this.uniqueRefConcept;
    }
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
    getEntity(entity) {
        if (this.uniqueRefConcept && this.uniqueRefConcept.getShortname().length > 0) {
            let index = this.entityArray.findIndex(e => e.isEqualTo(entity));
            if (index >= 0) {
                return this.entityArray[index];
            }
        }
    }
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
    // Pushing entities to database, without batch insertion //
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
    // Push references of all factory entities, insert or ignore statement fired.  
    // Make sure that all triplets linked to references are loaded.
    // loadAllSubjects() --> loadTriplets() --> pushRefsBatch()
    async pushRefsBatch() {
        let refs = [];
        for (let i = 0; i < this.entityArray.length; i++) {
            refs.push(...this.entityArray[i].getRefs());
        }
        await (await DBAdapter_1.DBAdapter.getInstance()).addReferencesBatch(refs);
    }
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
            }
        }
    }
    // Pushing triplets of factory entities, insert or ignore statmenet.
    async pushTripletsBatch() {
        let triplets = [];
        for (let i = 0; i < this.entityArray.length; i++) {
            triplets.push(...this.entityArray[i].getTriplets());
        }
        await (await DBAdapter_1.DBAdapter.getInstance()).addTripletsBatch(triplets, false);
    }
    async upsertTripletsBatch() {
        let triplets = [];
        for (let i = 0; i < this.entityArray.length; i++) {
            triplets.push(...this.entityArray[i].getTriplets().filter(t => { return t.isUpsert(); }));
        }
        await (await DBAdapter_1.DBAdapter.getInstance()).updateTripletsBatchById(triplets);
    }
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
            let lockTripTable = false;
            if (lastTipletToAdd)
                lockTripTable = true;
            // Inserting and getting max ids 
            //await (await DBAdapter.getInstance()).beginTransaction();
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
            if (concepts.length > 0)
                await (await DBAdapter_1.DBAdapter.getInstance()).addConceptsBatch(concepts);
            else
                LogManager_1.LogManager.getInstance().info("No concepts to push..");
            if (triplets.length > 0)
                await (await DBAdapter_1.DBAdapter.getInstance()).addTripletsBatch(triplets);
            else
                LogManager_1.LogManager.getInstance().info("No triplets to push..");
            if (references.length > 0)
                await (await DBAdapter_1.DBAdapter.getInstance()).addReferencesBatch(references, false);
            else
                LogManager_1.LogManager.getInstance().info("No refs to push..");
            //await (await DBAdapter.getInstance()).commit();
            LogManager_1.LogManager.getInstance().info("Pushed factory batch - " + this.getFullName());
        }
        else {
            LogManager_1.LogManager.getInstance().info("No new entity to push.. - " + this.getFullName());
        }
    }
    //TODO - This function needs triggers setup on concept and triplets table with maxid table
    async pushBatchWithTransaction() {
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
            //await (await DBAdapter.getInstance()).beginTransaction();
            await (await DBAdapter_1.DBAdapter.getInstance()).beginTransaction();
            await (await DBAdapter_1.DBAdapter.getInstance()).disbaleTrigger();
            let maxConceptId = await (await DBAdapter_1.DBAdapter.getInstance()).getMaxConceptIdFromMaxTable();
            let maxConId = String(Number(maxConceptId) + totalNewConc);
            await (await DBAdapter_1.DBAdapter.getInstance()).updateMaxConceptIdFromMaxTable(maxConId);
            lastConceptToAdd.setId(maxConId);
            await (await DBAdapter_1.DBAdapter.getInstance()).addConcept(lastConceptToAdd, true);
            if (lastTipletToAdd) {
                maxTripletId = await (await DBAdapter_1.DBAdapter.getInstance()).getMaxTripletIdFromMaxTable();
                let maxTripId = String(Number(maxTripletId) + totalNewTrips);
                await (await DBAdapter_1.DBAdapter.getInstance()).updateMaxTripletIdFromMaxTable(maxTripId);
                lastTipletToAdd.setId(maxTripId);
                await (await DBAdapter_1.DBAdapter.getInstance()).addTriplet(lastTipletToAdd, true);
            }
            await (await DBAdapter_1.DBAdapter.getInstance()).enableTrigger();
            await (await DBAdapter_1.DBAdapter.getInstance()).commit();
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
            await (await DBAdapter_1.DBAdapter.getInstance()).addBatchWithTransaction(concepts, triplets, references);
            LogManager_1.LogManager.getInstance().info("Pushed factory batch - " + this.getFullName());
        }
        else {
            LogManager_1.LogManager.getInstance().info("No new entity to push.. - " + this.getFullName());
        }
    }
    async batchRefUpdate(conceptId) {
        let refs = [];
        this.entityArray.forEach(e => {
            let r = e.getRefs().filter(r => { return r.getIdConcept().isSame(conceptId); });
            if (r)
                refs.push(...r);
        });
        await (await DBAdapter_1.DBAdapter.getInstance()).updateRefsBatchById(refs);
    }
    // Loads all entities with the given reference 
    async load(ref, loadAllEntityData = true, iterateDown = false, limit = 1000) {
        let entityTriplets = await (await DBAdapter_1.DBAdapter.getInstance()).getEntityTriplet(await SystemConcepts_1.SystemConcepts.get("contained_in_file"), await SystemConcepts_1.SystemConcepts.get(this.contained_in_file), ref, limit);
        for (let index = 0; index < (entityTriplets === null || entityTriplets === void 0 ? void 0 : entityTriplets.length); index++) {
            let entityTriplet = entityTriplets[index];
            let refs = [];
            let triplets = [];
            if (loadAllEntityData) {
                triplets = await (await DBAdapter_1.DBAdapter.getInstance()).getTripletsBySubject(entityTriplet.getSubject());
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
    // Note - Not thoroughly tested but works for the scenarios tested. Amazing feature!!
    // Optimized funtion for filtering.
    // Filter all the entities values with provided triplets and reference values 
    // Filter by triplets and refernce, if a refrence is added then reference should have 
    // tripletLink set and this triplet should be provided with triplets parameter.
    // Code Example -         
    // let blockchainEventFileConcpet = await SystemConcepts.get("blockchainEventFile");
    // let cifConcpet = await SystemConcepts.get("contained_in_file");
    // let contractFileConcept = await SystemConcepts.get("blockchainContract");
    // let quantityConcept = await SystemConcepts.get("quantity");
    // let tokenIdConcept = await SystemConcepts.get("tokenId");
    // let subConcept = new Concept(TemporaryId.create(), Concept.ENTITY_CONCEPT_CODE_PREFIX +
    // eventFactory.getIsAVerb(), null);
    // let t1 = new Triplet(
    //     TemporaryId.create(),
    //     subConcept,
    //     cifConcpet,
    //     blockchainEventFileConcpet
    // );
    // let t2 = new Triplet(
    //     TemporaryId.create(),
    //     subConcept,
    //     contractFileConcept,
    //     contract.getSubject()
    // );
    // let t3 = new Triplet(
    //     TemporaryId.create(),
    //     subConcept,
    //     await SystemConcepts.get("balanced"),
    //     await SystemConcepts.get("true")
    // );
    // let r1 = new Reference("", quantityConcept, t1, "");
    // let r2 = new Reference("", tokenIdConcept, t2, "1");
    // await eventFactory.filter([t1, t2, t3], [r1, r2], 100);
    async filter(triplets, refs, limit) {
        let concepts = await (await DBAdapter_1.DBAdapter.getInstance()).filter(triplets, refs, limit);
        concepts.forEach((val, key) => {
            let e = new Entity_1.Entity();
            e.setSubject(key);
            e.getTriplets().push(...val);
            e.setPushedStatus(true);
            e.setUniqueRefConcept(this.uniqueRefConcept);
            this.entityArray.push(e);
        });
    }
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
    async loadEntityConceptsRefs() {
        await (await DBAdapter_1.DBAdapter.getInstance()).getEntityConceptsRefs(this.entityArray, await SystemConcepts_1.SystemConcepts.get("contained_in_file"));
    }
    // Loading all the triplets of given factrory entities 
    async loadTriplets() {
        var _a;
        if (((_a = this.entityArray) === null || _a === void 0 ? void 0 : _a.length) == 0)
            return;
        let s = [];
        this.entityArray.forEach(e => {
            s.push(e.getSubject());
        });
        let triplets = await (await DBAdapter_1.DBAdapter.getInstance()).getTriplets(s);
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
    // Loading all the triplets of given factrory entities 
    async loadTripletsWithVerb(verb) {
        let s = [];
        this.entityArray.forEach(e => {
            s.push(e.getSubject());
        });
        let triplets = await (await DBAdapter_1.DBAdapter.getInstance()).getTriplets(s, [verb]);
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
}
exports.EntityFactory = EntityFactory;
//# sourceMappingURL=EntityFactory.js.map