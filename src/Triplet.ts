import { Concept } from "./Concept";

export class Triplet {

    private id: number;
    private subject: Concept;
    private verb: Concept;
    private target: Concept;
    private flag: boolean;

    constructor(id: number, subject: Concept, verb: Concept, target: Concept, flag: boolean = false) {
        this.id = id;
        this.subject = subject;
        this.verb = verb;
        this.target = target;
        this.flag = flag
    }

    getId() {
        return this.id;
    }

    getSubject() {
        return this.subject;
    }

    getVerb() {
        return this.verb;
    }

    getTarget() {
        return this.target;
    }

    getDBArrayFormat() {
        return [this.id.toString(), this.subject.getId().toString(), this.verb.getId().toString(), 
            this.target.getId().toString()];
    }


}