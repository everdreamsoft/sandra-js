"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Triplet = void 0;
class Triplet {
    constructor(id, subject, verb, target, flag = false, upsert = false) {
        this.id = id;
        this.subject = subject;
        this.verb = verb;
        this.target = target;
        this.flag = flag;
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
     * @returns Returns joined entity object
     */
    getJoinedEntity() {
        return this.joinedEntity;
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
    getDBArrayFormat(withId = true) {
        if (withId)
            return [this.id.toString(), this.subject.getId().toString(), this.verb.getId().toString(),
                this.target.getId().toString(), (this.flag ? "1" : "0")];
        else
            return [this.subject.getId().toString(), this.verb.getId().toString(),
                this.target.getId().toString(), (this.flag ? "1" : "0")];
    }
    /**
     * Sets the id of triplet
     * @param id
     */
    setId(id) {
        this.id = id;
    }
    /**
    * Sets upsert to true for current triplet, it is used to mark it for update in push queries
    */
    setUpsert(upsert) { this.upsert = upsert; }
    /**
     * Sets given entity as the joined entity of this triplet
     * @param entity
     */
    setJoinedEntity(entity) {
        this.joinedEntity = entity;
    }
    /**
     * Sets the target concept of this triplet with given target concept
     * @param target
     */
    setTarget(target) {
        this.target = target;
    }
    /**
     *
     * @param t
     * @returns Returns true if given triplet has same verb and triple with this triplet object.
     */
    isEqual(t) {
        if (this.getVerb().isSame(t.getVerb()) && this.getTarget().isSame(t.getTarget())) {
            return true;
        }
        return false;
    }
    /**
     * Checks if this triplet verb and target have same ids
     * @param verb
     * @param target
     * @returns Returns true if this triplet verb and target concepts have same ids as given in the parameters
     */
    isSame(verb, target) {
        if (this.getVerb().isSame(verb) && this.getTarget().isSame(target)) {
            return true;
        }
        return false;
    }
}
exports.Triplet = Triplet;
//# sourceMappingURL=Triplet.js.map