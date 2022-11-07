"use strict";
exports.__esModule = true;
exports.Reference = void 0;
var Reference = /** @class */ (function () {
    function Reference(id, concpet, tripletLink, value) {
        this.id = id;
        this.concept = concpet;
        this.value = value;
        this.tripletLink = tripletLink;
    }
    // Getting properties 
    Reference.prototype.getId = function () { return this.id; };
    Reference.prototype.getIdConcept = function () { return this.concept; };
    Reference.prototype.getValue = function () { return this.value; };
    Reference.prototype.getTripletLink = function () { return this.tripletLink; };
    // Setting properties 
    Reference.prototype.setId = function (id) { this.id = id; };
    Reference.prototype.setTripletLink = function (t) { this.tripletLink = t; };
    Reference.prototype.setValue = function (val) { this.value = val; };
    Reference.prototype.setIdConcept = function (c) { this.concept = c; };
    // Utilty Functions 
    // Compare a ref object with current 
    Reference.prototype.isEqualTo = function (ref) {
        return this.getIdConcept().isSame(ref.getIdConcept()) && this.getValue() == ref.getValue();
    };
    Reference.prototype.getDBArrayFormat = function (withId) {
        if (withId === void 0) { withId = true; }
        if (withId)
            return [this.id.toString(), this.concept.getId().toString(), this.tripletLink.getId().toString(),
                this.value];
        else
            return [this.concept.getId().toString(), this.tripletLink.getId().toString(),
                this.value];
    };
    return Reference;
}());
exports.Reference = Reference;
//# sourceMappingURL=Reference.js.map