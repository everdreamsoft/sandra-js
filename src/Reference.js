"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reference = void 0;
class Reference {
    constructor(id, concpet, tripletLink, value) {
        this.id = id;
        this.concept = concpet;
        this.value = value;
        this.tripletLink = tripletLink;
    }
    // Getting properties 
    getId() { return this.id; }
    getIdConcept() { return this.concept; }
    getValue() { return this.value; }
    getTripletLink() { return this.tripletLink; }
    // Setting properties 
    setId(id) { this.id = id; }
    setTripletLink(t) { this.tripletLink = t; }
    setValue(val) { this.value = val; }
    setIdConcept(c) { this.concept = c; }
    // Utilty Functions 
    // Compare a ref object with current 
    isEqualTo(ref) {
        return this.getIdConcept().isSame(ref.getIdConcept()) && this.getValue() == ref.getValue();
    }
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