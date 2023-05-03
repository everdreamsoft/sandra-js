import { Triplet } from "../models/Triplet";
import { Concept } from "./Concept";

export class Reference {

    private id: string;
    private concept?: Concept;
    private tripletLink?: Triplet;
    private value: string;

    private upsert: boolean;

    constructor(id: string, concpet: Concept | undefined, tripletLink: Triplet | undefined, value: string, upsert: boolean = false) {
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
    setId(id: string) { this.id = id; }

    /**
     * Sets tripletlink 
     * @param t 
     */
    setTripletLink(t: Triplet) { this.tripletLink = t; }

    /**
     * Sets value
     * @param val 
     */
    setValue(val: string) { this.value = val; }

    /**
     * Sets idConcept of this ref object
     * @param c 
     */
    setIdConcept(c: Concept) { this.concept = c; }

    /**
     * 
     * @returns Returns this ref object as json value with kay as shortname and value as value
     */
    asJson(): any {
        let json: any = {};
        if (this.getIdConcept()) {
            let key = this.getIdConcept()?.getShortname();
            if (key)
                json[key] = this.getValue();
        }
        return json;
    }

    /**
     * 
     * @param ref 
     * @returns Returns true if given ref object are same, compares idConcept and value 
     */
    isEqual(ref: Reference) {
        return this.getIdConcept()?.isEqual(ref.getIdConcept()) && this.getValue() == ref.getValue();
    }

    /**
     * 
     * @param withId 
     * @returns Returns this ref object as an array with values [id, idConcept, TargetLinkId, value]
     */
    getDBArrayFormat(withId: boolean = true) {

        if (withId)
            return [this.id.toString(), this.concept?.getId().toString(), this.tripletLink?.getId().toString(),
            this.value];

        else
            return [this.concept?.getId().toString(), this.tripletLink?.getId().toString(),
            this.value];

    }


}