"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityFactory = void 0;
const Concept_1 = require("./Concept");
const DBAdapter_1 = require("./DBAdapter");
const Entity_1 = require("./Entity");
const SystemConcepts_1 = require("./SystemConcepts");
class EntityFactory {
    constructor(is_a, contained_in_file, uniqueRefConcept) {
        this.entityArray = [];
        this.pushedStatus = false;
        this.is_a = is_a;
        this.contained_in_file = contained_in_file;
        this.uniqueRefConcept = uniqueRefConcept;
    }
    getEntities() { return this.entityArray; }
    async create(refs) {
        let e = new Entity_1.Entity();
        let subConcept = new Concept_1.Concept(-1, Concept_1.Concept.ENTITY_CONCEPT_CODE_PREFIX + this.getIsAVerb(), null);
        e.setFactory(this);
        e.setSubject(subConcept);
        // Set unique ref concept
        e.setUniqueRefConcept(this.uniqueRefConcept);
        // Adding is_a verb triplet
        await e.brother("is_a", this.is_a);
        // Adding contained_in_file triplet
        await e.brother("contained_in_file", this.contained_in_file, refs);
        // Adding it to the factory list
        this.add(e);
        return e;
    }
    getPushedStatus() { return this.pushedStatus; }
    setPushedStatus(status) { this.pushedStatus = status; }
    getIsAVerb() {
        return this.is_a;
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
    add(entity) {
        if (this.uniqueRefConcept && this.uniqueRefConcept.getShortname().length > 0) {
            let index = this.entityArray.findIndex(e => e.isEqualTo(entity));
            if (index >= 0) {
                this.entityArray[index] = entity;
            }
            else {
                this.entityArray.push(entity);
                if (!entity.getPushedStatus())
                    this.setPushedStatus(false);
            }
        }
        else {
            this.entityArray.push(entity);
            if (!entity.getPushedStatus())
                this.setPushedStatus(false);
        }
    }
    // Pushing entities to database, without batch insertion //
    async push() {
        var _a, _b;
        console.log("Pushing factory  - " + this.is_a + ", " + this.contained_in_file + " - " + this.entityArray.length);
        for (let index = 0; index < ((_a = this.entityArray) === null || _a === void 0 ? void 0 : _a.length); index++) {
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
                        await ((_b = t.getJoinedEntity().getFactory()) === null || _b === void 0 ? void 0 : _b.push());
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
        console.log("Pushed factory  - " + this.is_a + ", " + this.contained_in_file + " - " + this.entityArray.length);
    }
    async pushBatch() {
        var _a;
        let concepts = [];
        let triplets = [];
        let references = [];
        let maxConceptId = await (await DBAdapter_1.DBAdapter.getInstance()).getMaxConceptId();
        let maxTripletId = await (await DBAdapter_1.DBAdapter.getInstance()).getMaxTripletId();
        let maxRefId = await (await DBAdapter_1.DBAdapter.getInstance()).getMaxReferenceId();
        for (let index = 0; index < ((_a = this.entityArray) === null || _a === void 0 ? void 0 : _a.length); index++) {
            let e = this.entityArray[index];
            let s = e.getSubject();
            let trps = e.getTriplets();
            let refs = e.getRefs();
            if (s.getId() == -1) {
                maxConceptId = maxConceptId + 1;
                s.setId(maxConceptId);
                concepts.push(s);
            }
            trps.forEach(trp => {
                if (trp.getId() == -1) {
                    maxTripletId = maxTripletId + 1;
                    trp.setId(maxTripletId);
                    triplets.push(trp);
                }
            });
            refs.forEach(ref => {
                if (ref.getId() == -1) {
                    maxRefId = maxRefId + 1;
                    ref.setId(maxRefId);
                    references.push(ref);
                }
            });
        }
        await (await DBAdapter_1.DBAdapter.getInstance()).addConceptsBatch(concepts);
        await (await DBAdapter_1.DBAdapter.getInstance()).addTripletsBatch(triplets);
        await (await DBAdapter_1.DBAdapter.getInstance()).addReferencesBatch(references);
        console.log("pushed batch ");
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
            this.add(e);
        }
    }
    async loadBySubject(subject, iterateDown = false) {
        let entityConcept = await (await DBAdapter_1.DBAdapter.getInstance()).getConceptById(subject.getId());
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
        console.log("");
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
                let loadedS = entityConceptsMap.get(r.getValue());
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