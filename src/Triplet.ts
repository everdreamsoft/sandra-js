import { Concept } from "./Concept";
import { Entity } from "./Entity";

export class Triplet {

    private id: number;
    private subject: Concept;
    private verb: Concept;
    private target: Concept;

    private flag: boolean;
    private joinedEntity: Entity;

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

    getJoinedEntity() {
        return this.joinedEntity;
    }


    getDBArrayFormat(withId: boolean = true) {

        if (withId)
            return [this.id.toString(), this.subject.getId().toString(), this.verb.getId().toString(),
            this.target.getId().toString()];

        else
            return [this.subject.getId().toString(), this.verb.getId().toString(),
            this.target.getId().toString()];

    }

    setId(id: number) {
        this.id = id;
    }

    setJoinedEntity(entity: Entity) {
        this.joinedEntity = entity;
    }

}