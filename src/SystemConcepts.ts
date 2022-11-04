import { Concept } from "./Concept";
import { DBAdapter } from "./DBAdapter";

export class SystemConcepts {

    static readonly CODE_PREFIX = "system concept ";
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

        // check if it exist in memory 
        let c = this.concepts.find(concept => {
            return concept.getShortname() === shortname;
        })

        if (c) {
            return c;
        }

        // check if exist in DB
        c = await (await DBAdapter.getInstance()).getConcept(shortname);

        if (c) {
            this.concepts.push(c);
            return c;
        }

        // add in DB and return 
        c = await (await DBAdapter.getInstance()).addConcept(new Concept(-1, SystemConcepts.CODE_PREFIX + shortname, shortname));

        return c;

    }
}