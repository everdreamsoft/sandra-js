"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Concept = void 0;
class Concept {
    constructor(id, code, shortname) {
        this.id = id;
        this.code = code;
        this.shortname = shortname;
    }
    /**
     *
     * @returns Returns concept id.
     */
    getId() {
        return this.id;
    }
    /**
     *
     * @returns Returns concept code.
     */
    getCode() {
        return this.code;
    }
    /**
     *
     * @returns Returns concept shortname.
     */
    getShortname() {
        return this.shortname;
    }
    /**
     * Sets concept id.
     * @param id S
     */
    setId(id) {
        this.id = id;
    }
    /**
     * Sets concept code.
     * @param code
     */
    setCode(code) {
        this.code = code;
    }
    /**
     * Sets concept shortname.
     * @param sn
     */
    setShortname(sn) {
        this.shortname = sn;
    }
    /**
     *
     * @param concept
     * @returns Returns true if given concept id is same as this concept object id.
     */
    isEqual(concept) {
        return this.getId() === (concept === null || concept === void 0 ? void 0 : concept.getId());
    }
    /**
     * Copies the content of given concept to this concept object.
     * @param c
     */
    copy(c) {
        this.id = c.getId();
        this.code = c.getCode();
        this.shortname = c.getShortname();
    }
    /**
     *
     * @param withId
     * @returns Returns concept object as array [id,code,shortname], if is included if withId is true
     */
    getDBArrayFormat(withId = true) {
        if (withId)
            return [this.id.toString(), this.code, this.shortname];
        return [this.code, this.shortname];
    }
    /**
     *
     * @param withId
     * @returns Return concept as json
     */
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
Concept.SYSTEM_CONCEPT_CODE_PREFIX = "system concept ";
Concept.ENTITY_CONCEPT_CODE_PREFIX = "A ";
exports.Concept = Concept;
//# sourceMappingURL=Concept.js.map