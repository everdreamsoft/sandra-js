"use strict";
exports.__esModule = true;
exports.Triplet = void 0;
var Triplet = /** @class */ (function () {
    function Triplet(id, subject, verb, target, flag) {
        if (flag === void 0) { flag = false; }
        this.id = id;
        this.subject = subject;
        this.verb = verb;
        this.target = target;
        this.flag = flag;
    }
    Triplet.prototype.getId = function () {
        return this.id;
    };
    Triplet.prototype.getSubject = function () {
        return this.subject;
    };
    Triplet.prototype.getVerb = function () {
        return this.verb;
    };
    Triplet.prototype.getTarget = function () {
        return this.target;
    };
    Triplet.prototype.getJoinedEntity = function () {
        return this.joinedEntity;
    };
    Triplet.prototype.getDBArrayFormat = function (withId) {
        if (withId === void 0) { withId = true; }
        if (withId)
            return [this.id.toString(), this.subject.getId().toString(), this.verb.getId().toString(),
                this.target.getId().toString()];
        else
            return [this.subject.getId().toString(), this.verb.getId().toString(),
                this.target.getId().toString()];
    };
    Triplet.prototype.setId = function (id) {
        this.id = id;
    };
    Triplet.prototype.setJoinedEntity = function (entity) {
        this.joinedEntity = entity;
    };
    return Triplet;
}());
exports.Triplet = Triplet;
//# sourceMappingURL=Triplet.js.map