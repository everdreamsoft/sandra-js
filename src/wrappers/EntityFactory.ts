import { EventEmitter } from "stream";
import { SandraAdapter } from "../adapters/SandraAdapter";
import { DB } from "../connections/DB";
import { IAbortOption } from "../interfaces/IAbortOption";
import { LogManager } from "../loggers/LogManager";
import { Concept } from "../models/Concept";
import { Reference } from "../models/Reference";
import { SystemConcepts } from "../models/SystemConcepts";
import { Triplet } from "../models/Triplet";
import { TemporaryId } from "../utils/TemporaryId";
import { Entity } from "./Entity";

export class EntityFactory {

    private is_a: string
    private contained_in_file: string
    private uniqueRefConcept: Concept;

    private entityArray: Entity[] = [];
    private pushedStatus = false;
    private server: string;
    private abortOptions?: IAbortOption;

    constructor(is_a: string, contained_in_file: string, uniqueRefConcept: Concept, server: string = "sandra") {
        this.is_a = is_a || "generalIsA";
        this.contained_in_file = contained_in_file || "generalContainedInFile";
        this.uniqueRefConcept = uniqueRefConcept;
        this.server = server;
    }

    /**
     * 
     * @param refs Reference array list
     * @param upsert Set true if update is needed in DB for given references.
     * @returns Return new entity object if it does not exist in factory entity list, otherwise will return 
     * new entity object and adds it to factory list.   
    */
    async create(refs: Reference[], upsert?: boolean): Promise<Entity> {

        upsert = upsert || false;

        // Check if it arelady exist
        let uniqueRef1 = undefined;

        // Finding reference in array for unique concept
        if (this.uniqueRefConcept)
            uniqueRef1 = refs.find(ref => this.uniqueRefConcept?.isEqual(ref.getIdConcept()));

        let e: Entity | undefined = undefined;

        if (uniqueRef1)
            e = this.getEntityByRef(uniqueRef1);

        if (e) {

            e.setUpsert(upsert);
            let existingRefs = e.getRefs();
            let ts = e.getTriplets();

            let tIndex = ts.findIndex(t => { return t.getVerb()?.getShortname() == "contained_in_file" });

            // Add non existing refs with current entity or replace the value for same verb
            refs?.forEach(r => {

                let rIndex = existingRefs.findIndex(rI => { return rI.getIdConcept()?.isEqual(r.getIdConcept()) });

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

            e = new Entity(this);

            e.setUpsert(upsert);

            let subConcept = new Concept(TemporaryId.create(), Concept.ENTITY_CONCEPT_CODE_PREFIX + this.getIsAVerb(), undefined);

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

    setPushedStatus(status: boolean) { this.pushedStatus = status; }
    setAbortOptions(options?: IAbortOption) { this.abortOptions = options; }
    setQueryTimeout(timeMs: number) {
        if (this.abortOptions) this.abortOptions.timeout = timeMs;
        else this.abortOptions = { timeout: timeMs }
    }
    setAbortSignal(signal: EventEmitter) {
        if (this.abortOptions) this.abortOptions.abortSignal = signal;
        else this.abortOptions = { abort: false, abortSignal: signal }
    }

    getEntities(): Entity[] { return this.entityArray; }
    getPushedStatus() { return this.pushedStatus; }
    getIsAVerb() { return this.is_a; }
    getFullName() { return this.is_a + "/" + this.contained_in_file; }
    getContainedInFileVerb() { return this.contained_in_file; }
    getUniqueRefConcept() { return this.uniqueRefConcept; }
    getServerName() { return this.server; }

    /**
     * If factory abort options are set then it 
     * emits abort signal for queries and sets abort 
     * signal in factory to exit any running loop
     */
    abort(reason?: string) {
        this.abortOptions?.abortSignal?.emit("abort", reason);
    }

    /**
     * 
     * @param factory Factory class object to compare 
     * @returns Return true if given factory verb concept and contained in file concept are same
     */
    isSame(factory: EntityFactory): boolean {
        return this.is_a == factory.getIsAVerb() && this.contained_in_file == factory.getContainedInFileVerb();
    }

    /**
     * 
     * @param ref Reference object
     * @returns Returns the entity object of the factory containing given reference object 
     */
    getEntityByRef(ref: Reference): Entity | undefined {

        let index = this.entityArray.findIndex(e => {
            let refs1 = e.getRefs();
            if (refs1 && ref) {
                let uniqueRef1 = refs1.find(r => r.getIdConcept()?.isEqual(ref.getIdConcept()));
                return uniqueRef1?.isEqual(ref);
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
    getEntity(entity: Entity) {

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

        LogManager.getInstance().info("Pushing factory  - " + this.getFullName() + ", length - " + this.entityArray?.length);

        for (let index = 0; index < this.entityArray?.length; index++) {

            let entity = this.entityArray[index];

            if (entity.getPushedStatus()) { continue; }

            let sub = entity.getSubject();

            if (sub && TemporaryId.isValid(sub.getId())) {
                // Create subject 
                await (DB.getInstance().server(this.server) as SandraAdapter)?.addConcept(sub, false, this.abortOptions);
            }

            // Create triplets
            for (let indexTriplet = 0; indexTriplet < entity.getTriplets().length; indexTriplet++) {

                let t = entity.getTriplets()[indexTriplet];

                // Check if this is joined entity othewise push it also
                if (t.getJoinedEntity()) {
                    let factory = t.getJoinedEntity()?.getFactory();
                    if (factory && !factory.getPushedStatus()) {
                        await t.getJoinedEntity()?.getFactory()?.push();
                    }
                }

                if (t.isUpsert()) {
                    await (DB.getInstance().server(this.server) as SandraAdapter)?.upsertTriplet(t, this.abortOptions);
                }
                else {
                    await (DB.getInstance().server(this.server) as SandraAdapter)?.addTriplet(t, false, this.abortOptions);
                }

                if (t.getStorage()) {
                    await (DB.getInstance().server(this.server) as SandraAdapter)?.addDataStorage(t);
                }
            }

            // Create refs
            for (let indexRef = 0; indexRef < entity.getRefs().length; indexRef++) {
                if (entity.isUpsert()) {
                    await (DB.getInstance().server(this.server) as SandraAdapter)?.upsertRefs(entity.getRefs()[indexRef], this.abortOptions);
                } else {
                    await (DB.getInstance().server(this.server) as SandraAdapter)?.addRefs(entity.getRefs()[indexRef], this.abortOptions);
                }
            }

            entity.setPushedStatus(true);

        }

        this.setPushedStatus(true);

        LogManager.getInstance().info("Pushed factory  - " + this.getFullName());

    }

    /**
     * Pushes only references of each entity in the factory class.
     */
    async pushRefs() {

        for (let index = 0; index < this.entityArray?.length; index++) {

            let entity = this.entityArray[index];

            // Create refs
            for (let indexRef = 0; indexRef < entity.getRefs().length; indexRef++) {
                if (entity.isUpsert()) {
                    await (DB.getInstance().server(this.server) as SandraAdapter)?.upsertRefs(entity.getRefs()[indexRef], this.abortOptions);
                } else {
                    await (DB.getInstance().server(this.server) as SandraAdapter)?.addRefs(entity.getRefs()[indexRef], this.abortOptions);
                }
            }

        }


    }

    /**
     * Puses all triplets of each entity in the factory class.
     */
    async pushTriplets() {

        for (let index = 0; index < this.entityArray?.length; index++) {

            let entity = this.entityArray[index];

            // Create triplets
            for (let indexTriplet = 0; indexTriplet < entity.getTriplets().length; indexTriplet++) {

                let t = entity.getTriplets()[indexTriplet];

                if (t.isUpsert()) {
                    await (DB.getInstance().server(this.server) as SandraAdapter)?.upsertTriplet(t, this.abortOptions);
                }
                else {
                    await (DB.getInstance().server(this.server) as SandraAdapter)?.addTriplet(t, false, this.abortOptions);
                }

                if (t.getStorage()) {
                    await (DB.getInstance().server(this.server) as SandraAdapter)?.addDataStorage(t);
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
    async pushTripletsBatchWithVerb(verb: Concept, ignoreIfVerbExist: boolean = false) {

        let triplets = [];

        for (let i = 0; i < this.entityArray.length; i++) {

            let filtered = this.entityArray[i].getTriplets().filter(t => t.getVerb()?.isEqual(verb))

            if (filtered?.length > 0) {
                if (ignoreIfVerbExist) {
                    let index = filtered.findIndex(f => { return !TemporaryId.isValid(f.getId()) });
                    if (index < 0) {
                        triplets.push(...filtered);
                    }
                }
                else
                    triplets.push(...filtered);
            }

        }

        if (triplets.length > 0)
            await (DB.getInstance().server(this.server) as SandraAdapter)?.addTripletsBatch(triplets, false, true, this.abortOptions);

    }

    /**
     * Pushes entity list of the facotry class object in batch. 
     * In case there are too many enities are to be added this can be used to minimize query insertion time.
     * It also ignore all the entities that have pushed status set to true, pushed status is set after loading
     * factory class entities. Its set to true if the entity is already present in db. 
     */
    async pushBatch() {

        LogManager.getInstance().info("Pushing factory  batch - " + this.getFullName() + ", length - " + this.entityArray?.length);

        let newEntities = this.entityArray.filter(e => {
            let sub = e.getSubject();
            if (sub && TemporaryId.isValid(sub.getId())) {
                return e;
            }
        });

        let newConcepts: Concept[] = newEntities.map(e => {
            let sub = e.getSubject();
            if (sub) {
                return sub;
            }
            else throw new Error("Undefined subject object in push batch")
        });

        if (newConcepts?.length > 0) {

            let newTriplets: Triplet[] = [];
            newEntities.forEach(e => {
                newTriplets = [...newTriplets, ...e.getTriplets()];
            });

            let newRefs: Reference[] = [];
            newEntities.forEach(e => {
                newRefs = [...newRefs, ...e.getRefs()];
            });

            await (DB.getInstance().server(this.server) as SandraAdapter)?.beginTransaction();

            if (newConcepts.length > 0)
                await (DB.getInstance().server(this.server) as SandraAdapter)?.addConceptsBatch(newConcepts, this.abortOptions);

            if (newTriplets.length > 0)
                await (DB.getInstance().server(this.server) as SandraAdapter)?.addTripletsBatch(newTriplets, false, false, this.abortOptions);

            if (newRefs.length > 0)
                await (DB.getInstance().server(this.server) as SandraAdapter)?.addReferencesBatch(newRefs, false, this.abortOptions);

            await (DB.getInstance().server(this.server) as SandraAdapter)?.commit();

            LogManager.getInstance().info("Pushed factory batch - " + this.getFullName());

        }
        else {
            LogManager.getInstance().info("No new entity to push.. - " + this.getFullName());
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

        await (DB.getInstance().server(this.server) as SandraAdapter)?.addReferencesBatch(refs, false, this.abortOptions);

    }

    /**
     * Pushes triplets of all the entities of given facotry in batch call.
     */
    async pushTripletsBatch() {

        let triplets = [];

        for (let i = 0; i < this.entityArray.length; i++) {
            triplets.push(...this.entityArray[i].getTriplets());
        }

        await (DB.getInstance().server(this.server) as SandraAdapter)?.addTripletsBatch(triplets, false, true, this.abortOptions);

    }

    /**
     * Updates reference in DB of all the entities of a factory with given concept  
     * @param conceptId 
     */
    async batchRefUpdate(concept: Concept) {

        let refs: Reference[] = [];

        this.entityArray.forEach(e => {
            let r = e.getRefs().filter(r => { return r.getIdConcept()?.isEqual(concept) });
            if (r)
                refs.push(...r);
        });

        await (DB.getInstance().server(this.server) as SandraAdapter)?.updateRefsBatchById(refs, this.abortOptions);

    }

    /**
     * Udpates all the triplet where triplet upsert is true of all the entities of the factory object.
     */
    async upsertTripletsBatch() {

        let triplets = [];

        for (let i = 0; i < this.entityArray.length; i++) {
            triplets.push(...this.entityArray[i].getTriplets().filter(t => { return t.isUpsert() }));
        }

        await (DB.getInstance().server(this.server) as SandraAdapter)?.updateTripletsBatchById(triplets, this.abortOptions);

    }

    /**
        * Loads all the entities with given reference of the factory object.
        * @param ref Referance object to search for.
        * @param loadAllEntityData If true then all references and triplets are also loaded, if false only subject concept is loaded
        * @param iterateDown If true then all the joined entities are also loaded.
        * @param limit limits the number of result.
        
    */
    async load(ref: Reference, loadAllEntityData: boolean = true, iterateDown: boolean = false, limit: number = 1000) {

        let entityTriplets: Triplet[] = await (DB.getInstance().server(this.server) as SandraAdapter)?.getEntityTriplet(
            await SystemConcepts.get("contained_in_file", this.server),
            await SystemConcepts.get(this.contained_in_file, this.server),
            ref, limit, this.abortOptions
        );

        for (let index = 0; index < entityTriplets?.length; index++) {

            let entityTriplet = entityTriplets[index];
            let refs: Reference[] = [];
            let triplets: Triplet[] = [];

            if (loadAllEntityData) {

                triplets = await (DB.getInstance().server(this.server) as SandraAdapter)?.getTripletsBySubject(
                    entityTriplet.getSubject(), this.abortOptions
                );

                for (let i = 0; i < triplets.length; i++) {

                    if (iterateDown) {

                        let e = await this.loadBySubject(triplets[i].getTarget(), true);

                        if (e) {
                            triplets[i].setJoinedEntity(e);
                        }
                    }

                    let r = await (DB.getInstance().server(this.server) as SandraAdapter)?.getReferenceByTriplet(
                        triplets[i], undefined, this.abortOptions
                    );

                    // Load storage data for triplet
                    await (DB.getInstance().server(this.server) as SandraAdapter)?.getDataStorageByTriplet(
                        triplets[i]
                    );

                    refs.push(...r);

                }

            }

            let e = new Entity(this);
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
    async loadBySubject(subject: Concept | undefined, iterateDown: boolean = false) {

        let entityConcept: Concept | undefined = await ((DB.getInstance().server(this.server) as SandraAdapter) as SandraAdapter)?.getConceptById(
            Number(subject?.getId()),
            this.abortOptions
        );

        if (entityConcept) {

            // Get all the triplets for this entity 
            let triplets: Triplet[] = await (DB.getInstance().server(this.server) as SandraAdapter)?.getTripletsBySubject(
                entityConcept,
                this.abortOptions
            );

            let refs: Reference[] = [];

            for (let i = 0; i < triplets.length; i++) {

                if (iterateDown) {

                    let e = await this.loadBySubject(triplets[i].getTarget(), true);

                    if (e) {
                        triplets[i].setJoinedEntity(e);
                    }
                }

                let r = await (DB.getInstance().server(this.server) as SandraAdapter)?.getReferenceByTriplet(
                    triplets[i],
                    undefined,
                    this.abortOptions
                );

                refs.push(...r);

            }

            let e = new Entity(this);

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
    async filter(triplets: Triplet[], refs: Reference[], limit: number) {

        let concepts: any = await (DB.getInstance().server(this.server) as SandraAdapter)?.filter(
            triplets, refs, limit, this.abortOptions
        );

        concepts.forEach((val: Triplet[], key: Concept) => {
            if (this.abortOptions?.abort) throw Error("Abort signal recieved");
            let e = new Entity(this);
            e.setSubject(key);
            e.getTriplets().push(...val)
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
    async loadEntityConcepts(lastId?: string, limit?: string) {

        let cifFileTargetSub = await SystemConcepts.get(this.getContainedInFileVerb(), this.server);
        let cifFileVerbSub = await SystemConcepts.get("contained_in_file", this.server);

        let entityConcepts: Concept[] = await (DB.getInstance().server(this.server) as SandraAdapter)?.getEntityConcepts(
            cifFileVerbSub, cifFileTargetSub, lastId, limit, this.abortOptions
        );

        for (let index = 0; index < entityConcepts?.length; index++) {
            let entityConcept = entityConcepts[index];
            let e = new Entity(this);
            e.setSubject(entityConcept);
            e.setUniqueRefConcept(this.uniqueRefConcept);
            this.entityArray.push(e);
        }

    }

    /**
     * Loads the references of all entites of given factory 
     */
    async loadEntityConceptsRefs() {
        let cifSystem = await SystemConcepts.get("contained_in_file", this.server);
        await (DB.getInstance().server(this.server) as SandraAdapter)?.getEntityConceptsRefs(
            this.entityArray, cifSystem, this.abortOptions
        );
    }

    async loadTriplets(verb?: Concept, target?: Concept, loadConcepts?: boolean) {

        if (this.entityArray?.length == 0)
            return;

        let s: Concept[] = [];
        this.entityArray.forEach(e => {
            let sub = e.getSubject();
            if (sub)
                s.push(sub)
        })

        let verbArr = (verb ? [verb] : undefined);
        let targetArr = (target ? [target] : undefined);

        let triplets = await (DB.getInstance().server(this.server) as SandraAdapter)?.getTriplets(
            s, verbArr, targetArr, loadConcepts, this.abortOptions
        );

        this.entityArray.forEach(e => {

            let subId = e.getSubject()?.getId();
            let trps = triplets.filter(t => t.getSubject()?.getId() == subId);

            trps.forEach(t => {

                let triplet = e.getTriplets()?.find(tr => tr.getVerb()?.getId() == t.getVerb()?.getId() &&
                    tr.getTarget()?.getId() == t.getTarget()?.getId());
                if (triplet) {
                    triplet.setId(t.getId());
                }
                else {
                    e.getTriplets().push(t);
                }
            });

        })

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

        let refs: string[] = [];

        this.entityArray.forEach(entity => {
            let r = entity.getRef(this.uniqueRefConcept)
            if (r) refs.push(r.getValue());
        });

        let entityConceptsMap: Map<string, Concept> = await (DB.getInstance().server(this.server) as SandraAdapter)?.getEntityConceptsByRefs(
            new Triplet(
                "",
                undefined,
                await SystemConcepts.get("is_a", this.server),
                await SystemConcepts.get(this.is_a, this.server)),
            new Triplet(
                "",
                undefined,
                await SystemConcepts.get("contained_in_file", this.server),
                await SystemConcepts.get(this.contained_in_file, this.server)),
            refs,
            this.uniqueRefConcept,
            this.abortOptions
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
    async loadAllTripletRefs() {

        let ts: Triplet[] = [];

        if (this.entityArray?.length == 0)
            return;

        this.entityArray?.map(e => { ts = [...ts, ...e.getTriplets()] });

        let refs = await (DB.getInstance().server(this.server) as SandraAdapter)?.getReferenceByTriplets(
            ts, this.abortOptions
        );

        for (let i = 0; i < this.entityArray?.length; i++) {
            let e = this.entityArray[i];
            let triplets = e.getTriplets();
            triplets.forEach(t => {
                let refBatch = refs.filter(r => { return r.getTripletLink()?.getId() == t.getId() });
                if (refBatch && refBatch.length > 0) {

                    let existingRefs = e.getRefs();
                    refBatch?.forEach(r => {
                        let a = existingRefs.find(rf => rf.getIdConcept()?.getId() == r.getIdConcept()?.getId() && rf.getTripletLink()?.getId() == r.getTripletLink()?.getId());
                        if (a) {
                            a.setId(r.getId());
                        }
                        else {
                            r.setTripletLink(t)
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
    async addSubjectAsEntity(subject: Concept) {

        let i = this.entityArray.findIndex(e => { return e.getSubject()?.isEqual(subject) });
        if (i >= 0)
            return;

        let e = new Entity(this);
        e.setSubject(subject);
        this.entityArray.push(e);

    }

}

