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
        this.is_a = is_a;
        this.contained_in_file = contained_in_file;
        this.uniqueRefConcept = uniqueRefConcept;
    }
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
            }
        }
        else
            this.entityArray.push(entity);
    }
    // Pushing entities to database, without batch insertion //
    async push() {
        var _a;
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
                    await t.getJoinedEntity().getFactory().push();
                }
                await (await DBAdapter_1.DBAdapter.getInstance()).addTriplet(t);
            }
            // Create refs
            for (let indexRef = 0; indexRef < entity.getRefs().length; indexRef++) {
                await (await DBAdapter_1.DBAdapter.getInstance()).addRefs(entity.getRefs()[indexRef]);
            }
            entity.setPushedStatus(true);
        }
    }
    async pushBatch() {
        var _a;
        let concepts = [];
        for (let index = 0; index < ((_a = this.entityArray) === null || _a === void 0 ? void 0 : _a.length); index++) {
            let e = this.entityArray[index];
            concepts.push(e.getSubject());
        }
        await (await DBAdapter_1.DBAdapter.getInstance()).addConceptsBatch(concepts);
    }
    // Loads all entities with the given reference 
    async load(ref) {
        let entityTriplets = await (await DBAdapter_1.DBAdapter.getInstance()).getEntityTriplet(await SystemConcepts_1.SystemConcepts.get("contained_in_file"), await SystemConcepts_1.SystemConcepts.get(this.contained_in_file), ref);
        for (let index = 0; index < (entityTriplets === null || entityTriplets === void 0 ? void 0 : entityTriplets.length); index++) {
            let entityTriplet = entityTriplets[index];
            let refs = [];
            let triplets = await (await DBAdapter_1.DBAdapter.getInstance()).getTripletsBySubject(entityTriplet.getSubject());
            for (let i = 0; i < triplets.length; i++) {
                let e = await this.loadBySubject(triplets[i].getTarget());
                if (e) {
                    triplets[i].setJoinedEntity(e);
                }
                let r = await (await DBAdapter_1.DBAdapter.getInstance()).getReferenceByTriplet(triplets[i]);
                refs.push(...r);
            }
            let e = new Entity_1.Entity();
            e.setSubject(entityTriplet.getSubject());
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
                let e = await this.loadBySubject(triplets[i].getTarget());
                if (e) {
                    triplets[i].setJoinedEntity(e);
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
}
exports.EntityFactory = EntityFactory;
//# sourceMappingURL=EntityFactory.js.map