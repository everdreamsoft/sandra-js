import { Concept } from "./Concept";
import { DBAdapter } from "./DBAdapter";

export class SystemConcepts {

    private static concepts: Concept[];

    constructor() {
    }

    static add(concept: Concept) {
        this.concepts.push(concept);
    }

    static async load(shortname: string) {
        let c = await (await DBAdapter.getInstance()).getConcept(shortname);
        this.concepts.push(c);
        return c;
    }

    static async get(shortname: string) {
        let c = await (await DBAdapter.getInstance()).getConcept(shortname);
        this.concepts.push(c);
        return c;
    }
}