"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Triplet = void 0;
class Triplet {
    constructor(id, subject, verb, target, flag = false) {
        this.id = id;
        this.subject = subject;
        this.verb = verb;
        this.target = target;
        this.flag = flag;
    }
    getId() {
        return this.id;
    }
    getSubject() {
        return this.subject;
    }
    getVerb() {
        return this.verb;
    }
    getTarget() {
        return this.target;
    }
    getJoinedEntity() {
        return this.joinedEntity;
    }
    getDBArrayFormat(withId = true) {
        if (withId)
            return [this.id.toString(), this.subject.getId().toString(), this.verb.getId().toString(),
                this.target.getId().toString()];
        else
            return [this.subject.getId().toString(), this.verb.getId().toString(),
                this.target.getId().toString()];
    }
    setId(id) {
        this.id = id;
    }
    setJoinedEntity(entity) {
        this.joinedEntity = entity;
    }
}
exports.Triplet = Triplet;
//# sourceMappingURL=Triplet.js.map