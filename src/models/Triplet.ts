import { Entity } from "../wrappers/Entity";
import { Concept } from "./Concept";
import { DataStorage } from "./Datastorage";


export class Triplet {

    private id: string;

    private subject?: Concept;
    private verb?: Concept;
    private target?: Concept;
    private storage?: DataStorage;

    private flag: boolean;
    private upsert: boolean;

    private joinedEntity?: Entity;
    private verbEntity?: Entity;

    constructor(id: string, subject?: Concept, verb?: Concept, target?: Concept, flag: boolean = false, upsert: boolean = false) {
        this.id = id;
        this.subject = subject;
        this.verb = verb;
        this.target = target;
        this.flag = flag
        this.upsert = upsert;
    }

    /**
     * 
     * @returns Returns triplet id
     */
    getId() {
        return this.id;
    }

    /**
     * 
     * @returns Returns triplet subject concept
     */
    getSubject() {
        return this.subject;
    }

    /**
     * 
     * @returns Returns triplet verb concept
     */
    getVerb() {
        return this.verb;
    }

    /**
     * 
     * @returns Returns triplet target concpet
     */
    getTarget() {
        return this.target;
    }

    /**
     * 
     * @returns Returns triplet storage
     */
    getStorage() {
        return this.storage;
    }

    /**
     * 
     * @returns Returns joined entity object 
     */
    getJoinedEntity() {
        return this.joinedEntity;
    }

    getVerbEntity() {
        return this.verbEntity;
    }

    /**
     * 
     * @returns Returns true if this triplet object is marked as updatable for push queries
     */
    isUpsert() {
        return this.upsert;
    }

    /**
     * 
     * @param withId 
     * @returns Returns this triplet object as an array, with or wihout id
     */
    getDBArrayFormat(withId: boolean = true) {

        if (withId)
            return [this.id.toString(), this.subject?.getId().toString(), this.verb?.getId().toString(),
            this.target?.getId().toString(), (this.flag ? "1" : "0")];
        else
            return [this.subject?.getId().toString(), this.verb?.getId().toString(),
            this.target?.getId().toString(), (this.flag ? "1" : "0")];

    }

    /**
     * Sets the id of triplet
     * @param id 
     */
    setId(id: string) {
        this.id = id;
    }

    /**
    * Sets upsert to true for current triplet, it is used to mark it for update in push queries
    */
    setUpsert(upsert: boolean) { this.upsert = upsert; }

    /**
     * Sets given entity as the joined entity of this triplet 
     * @param entity 
     */
    setJoinedEntity(entity: Entity | undefined) {
        this.joinedEntity = entity;
    }

    /**
    * Sets given entity as the verb entity of this triplet 
    * @param entity 
    */
    setVerbEntity(entity: Entity | undefined) {
        this.verbEntity = entity;
    }

    /**
     * Sets the target concept of this triplet with given target concept
     * @param target 
     */
    setTarget(target: Concept) {
        this.target = target;
    }

    setStorage(value: string, upsert: boolean = false) {
        if (this.storage) {
            this.storage.setValue(value);
            this.storage.setUpsert(upsert);
        }
        else {
            this.storage = new DataStorage(value, upsert);
        }
    }

    /**
     * @param t 
     * @returns Returns true if given triplet has same verb and triple with this triplet object. 
     */
    isEqual(t: Triplet) {
        if (this.getVerb()?.isEqual(t.getVerb()) && this.getTarget()?.isEqual(t.getTarget())) {
            return true;
        }
        return false;
    }

}