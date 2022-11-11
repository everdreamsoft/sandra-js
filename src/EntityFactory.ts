import { Concept } from "./Concept";
import { DBAdapter } from "./DBAdapter";
import { Entity } from "./Entity";
import { LogManager } from "./loggers/LogManager";
import { Reference } from "./Reference";
import { SystemConcepts } from "./SystemConcepts";
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
        return "is a - " + this.is_a + " and contained in file - " + this.contained_in_file;
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

    async create(refs: Reference[]): Promise<Entity> {

        // Check if it arelady exist
        let uniqueRef1 = null;

        // Finding reference in array for unique concept
        if (this.uniqueRefConcept)
            uniqueRef1 = refs.find(ref => this.uniqueRefConcept?.isSame(ref.getIdConcept()));

        let e = this.getEntityByRef(uniqueRef1);

        if (e) {
            let ts = e.getTriplets();
            let tIndex = ts.findIndex(t => { return t.getVerb().getShortname() == "contained_in_file" });

            if (tIndex >= 0) {
                let t = ts[tIndex];
                refs.forEach(ref => ref.setTripletLink(t));
                e.setRefs(refs);
            }
        }
        else {

            e = new Entity();

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

        LogManager.getInstance().info("Pushed factory  - " + this.getFullName());

    }

    async pushBatch() {

        LogManager.getInstance().info("Pushing factory  batch - " + this.getFullName() + ", length - " + this.entityArray?.length);

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
            else {
                // Do not add triplets of subjects that are not pushed 
                continue;
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


        if (concepts && concepts.length > 0)
            await (await DBAdapter.getInstance()).addConceptsBatch(concepts);
        else
            LogManager.getInstance().info("No concepts to push..");

        if (triplets && triplets.length > 0)
            await (await DBAdapter.getInstance()).addTripletsBatch(triplets);
        else
            LogManager.getInstance().info("No triplets to push..");

        if (references && references.length > 0)
            await (await DBAdapter.getInstance()).addReferencesBatch(references);
        else
            LogManager.getInstance().info("No refs to push..");

        LogManager.getInstance().info("Pushed factory batch - " + this.getFullName());

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
            this.entityArray.push(e);

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

