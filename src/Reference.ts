import { Concept } from "./Concept";

export class Reference {

    private id: number;
    private concept: Concept;
    private value: string;
    private refLinkId: number;

    constructor(id: number, concpet: Concept, refLinkId: number, value: string) {
        this.id = id;
        this.concept = concpet;
        this.value = value;
        this.refLinkId = refLinkId;
    }

    getId() { return this.id; }

    getIdConcept() { return this.concept; }

    getValue() { return this.value; }

    getRefLinkId() { return this.refLinkId; }

    isEqualTo(ref: Reference) {
        return this.getIdConcept().isSame(ref.getIdConcept()) && this.getValue() == ref.getValue();
    }
}