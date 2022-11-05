import { Concept } from "./Concept";
import { DBAdapter } from "./DBAdapter";

export class SystemConcepts {

    private static concepts: Concept[] = [];

    constructor() {
    }

    static add(concept: Concept) {

        if (concept.getShortname()) {
            // Check if it exist
            let i = SystemConcepts.concepts.findIndex(c => concept.isSame(concept));
            if (i >= 0)
                return SystemConcepts.concepts[i];
        }

        SystemConcepts.concepts.push(concept);
        return concept

    }

    static async load(shortname: string) {
        let c = await (await DBAdapter.getInstance()).getConcept(shortname);
        SystemConcepts.concepts.push(c);
        return c;
    }

    static async get(shortname: string) {

        // check if it exist in memory 
        let c = SystemConcepts.concepts.find(concept => {
            return concept.getShortname() === shortname;
        })

        if (c) {
            return c;
        }

        // check if exist in DB
        c = await (await DBAdapter.getInstance()).getConcept(shortname);

        if (c) {
            SystemConcepts.concepts.push(c);
            return c;
        }

        // add in DB and return 
        c = await (await DBAdapter.getInstance()).addConcept(new Concept(-1, Concept.SYSTEM_CONCEPT_CODE_PREFIX + shortname, shortname));

        return c;

    }
}