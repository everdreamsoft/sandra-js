import { Concept } from "./Concept";
import { DBAdapter } from "./DBAdapter";
import { Entity } from "./Entity";
import { Reference } from "./Reference";
import { SystemConcepts } from "./SystemConcepts";
import { Triplet } from "./Triplet";
import { Utils } from "./Utils";

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

    async create(refs: Reference[]): Promise<Entity> {

        let e = new Entity();

        let subConcept = new Concept(-1, Concept.ENTITY_CONCEPT_CODE_PREFIX + this.getIsAVerb(), null);

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

    setPushedStatus(status: boolean) { this.pushedStatus = status; }

    getIsAVerb() {
        return this.is_a;
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

    add(entity: Entity) {

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

        console.log("Pushing factory  - " + this.is_a + ", " + this.contained_in_file + " - " + this.entityArray.length);

        for (let index = 0; index < this.entityArray?.length; index++) {

            let entity = this.entityArray[index];

            if (entity.getPushedStatus()) { continue; }

            // Create subject 
            await (await DBAdapter.getInstance()).addConcept(entity.getSubject());

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

                await (await DBAdapter.getInstance()).addTriplet(t);

            }

            // Create refs
            for (let indexRef = 0; indexRef < entity.getRefs().length; indexRef++) {
                await (await DBAdapter.getInstance()).addRefs(entity.getRefs()[indexRef]);
            }

            entity.setPushedStatus(true);

        }

        this.setPushedStatus(true);
        console.log("Pushed factory  - " + this.is_a + ", " + this.contained_in_file + " - " + this.entityArray.length);

    }

    async pushBatch() {

        let concepts = [];
        let triplets = [];
        let references = [];

        let maxConceptId = await (await DBAdapter.getInstance()).getMaxConceptId();
        let maxTripletId = await (await DBAdapter.getInstance()).getMaxTripletId();
        let maxRefId = await (await DBAdapter.getInstance()).getMaxReferenceId();

        for (let index = 0; index < this.entityArray?.length; index++) {

            let e = this.entityArray[index];

            let s = e.getSubject();
            let trps = e.getTriplets();
            let refs = e.getRefs();

            if (s.getId() == -1) {
                maxConceptId = maxConceptId + 1;
                s.setId(maxConceptId)
                concepts.push(s);
            }

            trps.forEach(trp => {
                if (trp.getId() == -1) {
                    maxTripletId = maxTripletId + 1;
                    trp.setId(maxTripletId)
                    triplets.push(trp);
                }
            });

            refs.forEach(ref => {
                if (ref.getId() == -1) {
                    maxRefId = maxRefId + 1;
                    ref.setId(maxRefId)
                    references.push(ref);
                }
            });


        }

        await (await DBAdapter.getInstance()).addConceptsBatch(concepts);
        await (await DBAdapter.getInstance()).addTripletsBatch(triplets);
        await (await DBAdapter.getInstance()).addReferencesBatch(references);

        console.log("pushed batch ")

    }

    // Loads all entities with the given reference 
    async load(ref: Reference, iterateDown: boolean = false) {

        let entityTriplets: Triplet[] = await (await DBAdapter.getInstance()).getEntityTriplet(
            await SystemConcepts.get("contained_in_file"),
            await SystemConcepts.get(this.contained_in_file),
            ref
        );

        for (let index = 0; index < entityTriplets?.length; index++) {

            let entityTriplet = entityTriplets[index];
            let refs: Reference[] = [];

            let triplets: Triplet[] = await (await DBAdapter.getInstance()).getTripletsBySubject(
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

            let e = new Entity();
            e.setSubject(entityTriplet.getSubject());
            e.setPushedStatus(true);
            e.getTriplets().push(...triplets);
            e.getRefs().push(...refs);
            e.setUniqueRefConcept(this.uniqueRefConcept);
            this.add(e);

        }

    }

    async loadBySubject(subject: Concept, iterateDown: boolean = false) {

        let entityConcept: Concept = await (await DBAdapter.getInstance()).getConceptById(
            subject.getId()
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

        console.log("");

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

