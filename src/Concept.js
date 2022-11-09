"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Concept = void 0;
class Concept {
    constructor(id, code, shortname) {
        this.id = id;
        this.code = code;
        this.shortname = shortname;
    }
    getId() {
        return this.id;
    }
    getCode() {
        return this.code;
    }
    getShortname() {
        return this.shortname;
    }
    setId(id) {
        this.id = id;
    }
    setCode(code) {
        this.code = code;
    }
    setShortname(sn) {
        this.shortname = sn;
    }
    isSame(concept) {
        return this.getShortname() === concept.getShortname();
    }
    getDBArrayFormat(withId = true) {
        if (withId)
            return [this.id.toString(), this.code, this.shortname];
        return [this.code, this.shortname];
    }
    getJSON(withId = true) {
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
    }
}
exports.Concept = Concept;
Concept.SYSTEM_CONCEPT_CODE_PREFIX = "system concept ";
Concept.ENTITY_CONCEPT_CODE_PREFIX = "A ";
//# sourceMappingURL=Concept.js.map