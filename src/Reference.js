"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reference = void 0;
class Reference {
    constructor(id, concpet, tripletLink, value, upsert = false) {
        this.id = id;
        this.concept = concpet;
        this.value = value;
        this.tripletLink = tripletLink;
        this.upsert = upsert;
    }
    /**
     *
     * @returns Returns id
     */
    getId() { return this.id; }
    /**
     *
     * @returns Returns concpet of reference
     */
    getIdConcept() { return this.concept; }
    /**
     *
     * @returns Returns value
     */
    getValue() { return this.value; }
    /**
     *
     * @returns Returns triplet link concept
     */
    getTripletLink() { return this.tripletLink; }
    /**
     *
     * @returns Returns true if reference is marked for update for push queries
     */
    isUpsert() {
        return this.upsert;
    }
    /**
     * Sets id
     * @param id
     */
    setId(id) { this.id = id; }
    /**
     * Sets tripletlink
     * @param t
     */
    setTripletLink(t) { this.tripletLink = t; }
    /**
     * Sets value
     * @param val
     */
    setValue(val) { this.value = val; }
    /**
     * Sets idConcept of this ref object
     * @param c
     */
    setIdConcept(c) { this.concept = c; }
    /**
     *
     * @returns Returns this ref object as json value with kay as shortname and value as value
     */
    asJson() {
        let json = {};
        json[this.getIdConcept().getShortname()] = this.getValue();
        return json;
    }
    /**
     *
     * @param ref
     * @returns Returns true if given ref object are same, compares idConcept and value
     */
    isEqualTo(ref) {
        return this.getIdConcept().isSame(ref.getIdConcept()) && this.getValue() == ref.getValue();
    }
    /**
     *
     * @param withId
     * @returns Returns this ref object as an array with values [id, idConcept, TargetLinkId, value]
     */
    getDBArrayFormat(withId = true) {
        if (withId)
            return [this.id.toString(), this.concept.getId().toString(), this.tripletLink.getId().toString(),
                this.value];
        else
            return [this.concept.getId().toString(), this.tripletLink.getId().toString(),
                this.value];
    }
}
exports.Reference = Reference;
//# sourceMappingURL=Reference.js.map