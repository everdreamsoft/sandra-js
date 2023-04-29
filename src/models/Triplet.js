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
        var _a, _b, _c, _d, _e, _f;
        if (withId)
            return [this.id.toString(), (_a = this.subject) === null || _a === void 0 ? void 0 : _a.getId().toString(), (_b = this.verb) === null || _b === void 0 ? void 0 : _b.getId().toString(), (_c = this.target) === null || _c === void 0 ? void 0 : _c.getId().toString(), (this.flag ? "1" : "0")];
        else
            return [(_d = this.subject) === null || _d === void 0 ? void 0 : _d.getId().toString(), (_e = this.verb) === null || _e === void 0 ? void 0 : _e.getId().toString(), (_f = this.target) === null || _f === void 0 ? void 0 : _f.getId().toString(), (this.flag ? "1" : "0")];
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
     * @param t
     * @returns Returns true if given triplet has same verb and triple with this triplet object.
     */
    isEqual(t) {
        var _a, _b;
        if (((_a = this.getVerb()) === null || _a === void 0 ? void 0 : _a.isEqual(t.getVerb())) && ((_b = this.getTarget()) === null || _b === void 0 ? void 0 : _b.isEqual(t.getTarget()))) {
            return true;
        }
        return false;
    }
}
exports.Triplet = Triplet;
//# sourceMappingURL=Triplet.js.map