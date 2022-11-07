"use strict";
exports.__esModule = true;
exports.Concept = void 0;
var Concept = /** @class */ (function () {
    function Concept(id, code, shortname) {
        this.id = id;
        this.code = code;
        this.shortname = shortname;
    }
    Concept.prototype.getId = function () {
        return this.id;
    };
    Concept.prototype.getCode = function () {
        return this.code;
    };
    Concept.prototype.getShortname = function () {
        return this.shortname;
    };
    Concept.prototype.setId = function (id) {
        this.id = id;
    };
    Concept.prototype.isSame = function (concept) {
        return this.getShortname() === concept.getShortname();
    };
    Concept.prototype.getDBArrayFormat = function (withId) {
        if (withId === void 0) { withId = true; }
        if (withId)
            return [this.id.toString(), this.code, this.shortname];
        return [this.code, this.shortname];
    };
    Concept.prototype.getJSON = function (withId) {
        if (withId === void 0) { withId = true; }
        if (withId)
            return {
                "id": this.id.toString(),
                "code": this.code,
                "shortname": this.shortname
            };
        return {
            "code": this.code,
            "shortname": this.shortname
        };
    };
    Concept.SYSTEM_CONCEPT_CODE_PREFIX = "system concept ";
    Concept.ENTITY_CONCEPT_CODE_PREFIX = "A ";
    return Concept;
}());
exports.Concept = Concept;
//# sourceMappingURL=Concept.js.map