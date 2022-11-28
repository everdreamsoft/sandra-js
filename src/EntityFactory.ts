import { Concept } from "./Concept";
import { DBAdapter } from "./DBAdapter";
import { Entity } from "./Entity";
import { LogManager } from "./loggers/LogManager";
import { Reference } from "./Reference";
import { SystemConcepts } from "./SystemConcepts";
import { TemporaryId } from "./TemporaryId";
import { Triplet } from "./Triplet";

export class EntityFactory {

    private is_a: string
    private contained_in_file: string
    private uniqueRefConcept: Concept;

    private entityArray: Entity[] = [];
    private pushedStatus = false;

    constructor(is_a: string, contained_in_file: string, uniqueRefConcept: Concept) {
        this.is_a = is_a;
        this.contained_in_file = contained_in_file;
        this.uniqueRefConcept = uniqueRefConcept;
    }

    getEntities(): Entity[] { return this.entityArray; }

    getPushedStatus() { return this.pushedStatus; }

    setPushedStatus(status: boolean) { this.pushedStatus = status; }

    getIsAVerb() {
        return this.is_a;
    }

    getFullName() {
        return this.is_a + "/" + this.contained_in_file;
    }

    getContainedInFileVerb() {
        return this.contained_in_file;
    }

    isSame(factory: EntityFactory): boolean {
        return this.is_a == factory.getIsAVerb() && this.contained_in_file == factory.getContainedInFileVerb();
    }

    getUniqueRefConcept() {
        return this.uniqueRefConcept;
    }

    getEntityByRef(ref: Reference) {

        let index = this.entityArray.findIndex(e => {
            let refs1 = e.getRefs();
            if (refs1 && ref) {
                let uniqueRef1 = refs1.find(r => r.getIdConcept()?.isSame(ref.getIdConcept()));
                return uniqueRef1.isEqualTo(ref);
            }
            return false;
        });

        if (index >= 0)
            return this.entityArray[index];

        return null;

    }

    getEntity(entity: Entity) {
        if (this.uniqueRefConcept && this.uniqueRefConcept.getShortname().length > 0) {
            let index = this.entityArray.findIndex(e => e.isEqualTo(entity));
            if (index >= 0) {
                return this.entityArray[index];
            }
        }
    }

    async create(refs: Reference[], upsert: boolean = false): Promise<Entity> {

        // Check if it arelady exist
        let uniqueRef1 = null;

        // Finding reference in array for unique concept
        if (this.uniqueRefConcept)
            uniqueRef1 = refs.find(ref => this.uniqueRefConcept?.isSame(ref.getIdConcept()));

        let e = this.getEntityByRef(uniqueRef1);

        if (e) {

            e.setUpsert(upsert);

            let existingRefs = e.getRefs();
            let ts = e.getTriplets();
            let tIndex = ts.findIndex(t => { return t.getVerb().getShortname() == "contained_in_file" });

            // Add non existing refs with current entity or replace the value for same verb
            refs?.forEach(r => {

                let rIndex = existingRefs.findIndex(rI => { return rI.getIdConcept().isSame(r.getIdConcept()) });

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

            e = new Entity();

            e.setUpsert(upsert);

            let subConcept = new Concept(TemporaryId.create(), Concept.ENTITY_CONCEPT_CODE_PREFIX + this.getIsAVerb(), null);

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

        LogManager.getInstance().info("Pushing factory  - " + this.getFullName() + ", length - " + this.entityArray?.length);

        for (let index = 0; index < this.entityArray?.length; index++) {

            let entity = this.entityArray[index];

            if (entity.getPushedStatus()) { continue; }

            if (TemporaryId.isValid(entity.getSubject().getId())) {
                // Create subject 
                await (await DBAdapter.getInstance()).addConcept(entity.getSubject());
            }

            // Create triplets
            for (let indexTriplet = 0; indexTriplet < entity.getTriplets().length; indexTriplet++) {

                let t = entity.getTriplets()[indexTriplet];

                // Check if this is joined entity othewise push it also
                if (t.getJoinedEntity()) {
                    let factory = t.getJoinedEntity().getFactory();
                    if (factory && !factory.getPushedStatus()) {
                        await t.getJoinedEntity().getFactory()?.push();
                    }
                }

                if (t.isUpsert()) {
                    await (await DBAdapter.getInstance()).upsertTriplet(t);
                }
                else {
                    await (await DBAdapter.getInstance()).addTriplet(t);
                }

            }

            // Create refs
            for (let indexRef = 0; indexRef < entity.getRefs().length; indexRef++) {
                if (entity.isUpsert()) {
                    await (await DBAdapter.getInstance()).upsertRefs(entity.getRefs()[indexRef]);
                } else {
                    await (await DBAdapter.getInstance()).addRefs(entity.getRefs()[indexRef]);
                }
            }

            entity.setPushedStatus(true);

        }

        this.setPushedStatus(true);

        LogManager.getInstance().info("Pushed factory  - " + this.getFullName());

    }

    async pushBatch() {

        LogManager.getInstance().info("Pushing factory  batch - " + this.getFullName() + ", length - " + this.entityArray?.length);

        let concepts = [];
        let triplets = [];
        let references = [];

        let newEntities = this.entityArray.filter(e => {
            if (TemporaryId.isValid(e.getSubject().getId())) {
                return e;
            }
        });

        let newConcepts = newEntities.map(e => {
            return e.getSubject();
        });

        if (newConcepts?.length > 0) {

            let newTriplets = [];
            newEntities.forEach(e => {
                newTriplets = [...newTriplets, ...e.getTriplets()];
            });

            let newRef = [];
            newEntities.forEach(e => {
                newRef = [...newRef, ...e.getRefs()];
            });

            let totalNewConc = newConcepts?.length;
            let totalNewTrips = newTriplets?.length;

            let lastConceptToAdd = newConcepts[newConcepts.length - 1];

            let lastTipletToAdd: Triplet;
            let maxTripletId = -1;
            if (newTriplets.length > 0)
                lastTipletToAdd = newTriplets[newTriplets.length - 1];

            let lockTripTable = false;
            if (lastTipletToAdd) lockTripTable = true;

            // Inserting and getting max ids 
            // await (await DBAdapter.getInstance()).beginTransaction();
            await (await DBAdapter.getInstance()).lockTables(true, lockTripTable);

            let maxConceptId = await (await DBAdapter.getInstance()).getMaxConceptId();
            lastConceptToAdd.setId(String(Number(maxConceptId) + totalNewConc));
            await (await DBAdapter.getInstance()).addConcept(lastConceptToAdd, true);

            if (lastTipletToAdd) {
                maxTripletId = await (await DBAdapter.getInstance()).getMaxTripletId();
                lastTipletToAdd.setId(String(Number(maxTripletId) + totalNewTrips));
                await (await DBAdapter.getInstance()).addTriplet(lastTipletToAdd, true);
            }

            await (await DBAdapter.getInstance()).unlockTable();

            // Add till second last because last id was already added
            for (let i = 0; i <= newConcepts.length - 2; i++) {
                maxConceptId = maxConceptId + 1;
                let c = newConcepts[i];
                c.setId(maxConceptId)
                concepts.push(c);
            }

            for (let i = 0; i <= newTriplets.length - 2; i++) {
                maxTripletId = maxTripletId + 1;
                let t = newTriplets[i];
                t.setId(maxTripletId)
                triplets.push(t);
            }

            for (let i = 0; i <= newRef.length - 1; i++) {
                references.push(newRef[i]);
            }

            if (concepts.length > 0)
                await (await DBAdapter.getInstance()).addConceptsBatch(concepts);
            else
                LogManager.getInstance().info("No concepts to push..");

            if (triplets.length > 0)
                await (await DBAdapter.getInstance()).addTripletsBatch(triplets);
            else
                LogManager.getInstance().info("No triplets to push..");

            if (references.length > 0)
                await (await DBAdapter.getInstance()).addReferencesBatch(references, false);
            else
                LogManager.getInstance().info("No refs to push..");

            //await (await DBAdapter.getInstance()).commit();

            LogManager.getInstance().info("Pushed factory batch - " + this.getFullName());

        }
        else {
            LogManager.getInstance().info("No new entity to push.. - " + this.getFullName());

        }

    }

    async batchRefUpdate(conceptId: Concept) {

        let refs: Reference[] = [];

        this.entityArray.forEach(e => {
            let r = e.getRefs().filter(r => { return r.getIdConcept().isSame(conceptId) });
            if (r)
                refs.push(...r);
        });

        await (await DBAdapter.getInstance()).updateRefsBatchById(refs);

        console.log("updated..");

    }

    // Loads all entities with the given reference 
    async load(ref: Reference, loadAllEntityData: boolean = true, iterateDown: boolean = false, limit: number = 1000) {

        let entityTriplets: Triplet[] = await (await DBAdapter.getInstance()).getEntityTriplet(
            await SystemConcepts.get("contained_in_file"),
            await SystemConcepts.get(this.contained_in_file),
            ref, limit
        );

        for (let index = 0; index < entityTriplets?.length; index++) {

            let entityTriplet = entityTriplets[index];
            let refs: Reference[] = [];
            let triplets: Triplet[] = [];

            if (loadAllEntityData) {

                triplets = await (await DBAdapter.getInstance()).getTripletsBySubject(
                    entityTriplet.getSubject()
                );

                for (let i = 0; i < triplets.length; i++) {

                    if (iterateDown) {

                        let e = await this.loadBySubject(triplets[i].getTarget(), true);

                        if (e) {
                            triplets[i].setJoinedEntity(e);
                        }
                    }

                    let r = await (await DBAdapter.getInstance()).getReferenceByTriplet(
                        triplets[i]
                    );

                    refs.push(...r);

                }

            }

            let e = new Entity();

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

    async loadBySubject(subject: Concept, iterateDown: boolean = false) {

        let entityConcept: Concept = await (await DBAdapter.getInstance()).getConceptById(
            Number(subject.getId())
        );

        if (entityConcept) {

            // Get all the triplets for this entity 
            let triplets: Triplet[] = await (await DBAdapter.getInstance()).getTripletsBySubject(
                entityConcept
            );

            let refs: Reference[] = [];

            for (let i = 0; i < triplets.length; i++) {

                if (iterateDown) {

                    let e = await this.loadBySubject(triplets[i].getTarget(), true);

                    if (e) {
                        triplets[i].setJoinedEntity(e);
                    }
                }

                let r = await (await DBAdapter.getInstance()).getReferenceByTriplet(
                    triplets[i]
                );

                refs.push(...r);

            }

            let e = new Entity();
            e.setSubject(subject);
            e.getTriplets().push(...triplets);
            e.getRefs().push(...refs);

            return e;
        }

        return null;

    }

    async loadEntityConcepts(lastId?: string, limit?: string) {

        let entityConcepts: Concept[] = await (await DBAdapter.getInstance()).getEntityConcepts(
            this.is_a, lastId, limit
        );

        for (let index = 0; index < entityConcepts?.length; index++) {
            let entityConcept = entityConcepts[index];
            let e = new Entity();
            e.setSubject(entityConcept);
            e.setUniqueRefConcept(this.uniqueRefConcept);
            this.entityArray.push(e);
        }

    }

    async loadAllSubjects() {

        let refs = this.entityArray.map(entity => {
            let r = entity.getRef(this.uniqueRefConcept)
            if (r) return r.getValue();
        })

        let entityConceptsMap: Map<string, Concept> = await (await DBAdapter.getInstance()).getEntityConceptsByRefs(
            await SystemConcepts.get("contained_in_file"),
            await SystemConcepts.get(this.contained_in_file),
            refs,
            this.uniqueRefConcept
        );

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

    async loadAllTripletRefs(refConcept: Concept = null) {

        let ts = [];

        if (this.entityArray?.length == 0)
            return;

        this.entityArray?.map(e => { ts = [...ts, ...e.getTriplets()] });

        let refs = await (await DBAdapter.getInstance()).getReferenceByTriplets(
            ts
        );

        for (let i = 0; i < this.entityArray?.length; i++) {
            let e = this.entityArray[i];
            let triplets = e.getTriplets();
            triplets.forEach(t => {
                let refBatch = refs.filter(r => { return r.getTripletLink().getId() == t.getId() });
                if (refBatch && refBatch.length > 0) {
                    refBatch?.forEach(r => { r.setTripletLink(t) });
                    e.getRefs().push(...refBatch);
                }
            });
        }

    }
}

