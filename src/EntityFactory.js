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
    async create(refs) {
        // Check if it arelady exist
        let uniqueRef1 = null;
        // Finding reference in array for unique concept
        if (this.uniqueRefConcept)
            uniqueRef1 = refs.find(ref => { var _a; return (_a = this.uniqueRefConcept) === null || _a === void 0 ? void 0 : _a.isSame(ref.getIdConcept()); });
        let e = this.getEntityByRef(uniqueRef1);
        if (e) {
            let existingRefs = e.getRefs();
            let ts = e.getTriplets();
            let tIndex = ts.findIndex(t => { return t.getVerb().getShortname() == "contained_in_file"; });
            // Add non existing refs with current entity or replace the value for same verb
            refs.forEach(r => {
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
            // Create subject 
            await (await DBAdapter_1.DBAdapter.getInstance()).addConcept(entity.getSubject());
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
                await (await DBAdapter_1.DBAdapter.getInstance()).addTriplet(t);
            }
            // Create refs
            for (let indexRef = 0; indexRef < entity.getRefs().length; indexRef++) {
                await (await DBAdapter_1.DBAdapter.getInstance()).addRefs(entity.getRefs()[indexRef]);
            }
            entity.setPushedStatus(true);
        }
        this.setPushedStatus(true);
        LogManager_1.LogManager.getInstance().info("Pushed factory  - " + this.getFullName());
    }
    async pushBatch1() {
        var _a, _b;
        LogManager_1.LogManager.getInstance().info("Pushing factory  batch - " + this.getFullName() + ", length - " + ((_a = this.entityArray) === null || _a === void 0 ? void 0 : _a.length));
        let concepts = [];
        let triplets = [];
        let references = [];
        let maxConceptId = await (await DBAdapter_1.DBAdapter.getInstance()).getMaxConceptId();
        let maxTripletId = await (await DBAdapter_1.DBAdapter.getInstance()).getMaxTripletId();
        let maxRefId = await (await DBAdapter_1.DBAdapter.getInstance()).getMaxReferenceId();
        for (let index = 0; index < ((_b = this.entityArray) === null || _b === void 0 ? void 0 : _b.length); index++) {
            let e = this.entityArray[index];
            let s = e.getSubject();
            let trps = e.getTriplets();
            let refs = e.getRefs();
            if (TemporaryId_1.TemporaryId.isValid(s.getId())) {
                maxConceptId = maxConceptId + 1;
                s.setId(maxConceptId);
                concepts.push(s);
            }
            else {
                // Do not add triplets of subjects that are pushed 
                continue;
            }
            trps.forEach(trp => {
                if (TemporaryId_1.TemporaryId.isValid(trp.getId())) {
                    maxTripletId = maxTripletId + 1;
                    trp.setId(maxTripletId);
                    triplets.push(trp);
                }
            });
            refs.forEach(ref => {
                if (TemporaryId_1.TemporaryId.isValid(ref.getId())) {
                    maxRefId = maxRefId + 1;
                    ref.setId(maxRefId);
                    references.push(ref);
                }
            });
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
            await (await DBAdapter_1.DBAdapter.getInstance()).addReferencesBatch(references);
        else
            LogManager_1.LogManager.getInstance().info("No refs to push..");
        LogManager_1.LogManager.getInstance().info("Pushed factory batch - " + this.getFullName());
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
            await (await DBAdapter_1.DBAdapter.getInstance()).beginTransaction();
            await (await DBAdapter_1.DBAdapter.getInstance()).lockTables(true, lockTripTable);
            let maxConceptId = await (await DBAdapter_1.DBAdapter.getInstance()).getMaxConceptId();
            lastConceptToAdd.setId(String(Number(maxConceptId) + totalNewConc));
            await (await DBAdapter_1.DBAdapter.getInstance()).addConcept(lastConceptToAdd, true);
            if (lastTipletToAdd) {
                maxTripletId = await (await DBAdapter_1.DBAdapter.getInstance()).getMaxTripletId();
                lastTipletToAdd.setId(String(Number(maxTripletId) + totalNewTrips));
                await (await DBAdapter_1.DBAdapter.getInstance()).addTriplet(lastTipletToAdd, true);
            }
            await (await DBAdapter_1.DBAdapter.getInstance()).unlockTable();
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
            await (await DBAdapter_1.DBAdapter.getInstance()).commit();
            LogManager_1.LogManager.getInstance().info("Pushed factory batch - " + this.getFullName());
        }
        else {
            LogManager_1.LogManager.getInstance().info("No new entity to push.. - " + this.getFullName());
        }
    }
    // Loads all entities with the given reference 
    async load(ref, iterateDown = false) {
        let entityTriplets = await (await DBAdapter_1.DBAdapter.getInstance()).getEntityTriplet(await SystemConcepts_1.SystemConcepts.get("contained_in_file"), await SystemConcepts_1.SystemConcepts.get(this.contained_in_file), ref);
        for (let index = 0; index < (entityTriplets === null || entityTriplets === void 0 ? void 0 : entityTriplets.length); index++) {
            let entityTriplet = entityTriplets[index];
            let refs = [];
            let triplets = await (await DBAdapter_1.DBAdapter.getInstance()).getTripletsBySubject(entityTriplet.getSubject());
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
            e.setSubject(entityTriplet.getSubject());
            e.setPushedStatus(true);
            e.getTriplets().push(...triplets);
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
    async loadAllSubjects() {
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
}
exports.EntityFactory = EntityFactory;
//# sourceMappingURL=EntityFactory.js.map