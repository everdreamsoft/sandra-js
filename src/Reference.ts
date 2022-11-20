import { Concept } from "./Concept";
import { Triplet } from "./Triplet";

export class Reference {

    private id: string;
    private concept: Concept;
    private value: string;
    private tripletLink: Triplet;

    constructor(id: string, concpet: Concept, tripletLink: Triplet, value: string) {
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
    setId(id: string) { this.id = id; }

    setTripletLink(t: Triplet) { this.tripletLink = t; }

    setValue(val: string) { this.value = val; }

    setIdConcept(c: Concept) { this.concept = c; }


    // Compare a ref object with current 
    isEqualTo(ref: Reference) {
        return this.getIdConcept().isSame(ref.getIdConcept()) && this.getValue() == ref.getValue();
    }

    getDBArrayFormat(withId: boolean = true) {

        if (withId)
            return [this.id.toString(), this.concept.getId().toString(), this.tripletLink.getId().toString(),
            this.value];

        else
            return [this.concept.getId().toString(), this.tripletLink.getId().toString(),
            this.value];

    }


}