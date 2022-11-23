import { Concept } from "./Concept";
import { DBAdapter } from "./DBAdapter";
import { TemporaryId } from "./TemporaryId";

export class SystemConcepts {

    private static concepts: Map<string, Concept> = new Map();

    constructor() {

    }

    static async add(concept: Concept) {

        if (concept.getShortname()) {
            return await SystemConcepts.get(concept.getShortname());
        }
        throw new Error("Not a system concpet, trying to push shortname with null value");

    }


    static async get(shortname: string) {

        // check if it exist in memory 
        let c = SystemConcepts.concepts.get(shortname);

        if (c) {
            return c;
        }

        // check if exist in DB
        c = await (await DBAdapter.getInstance()).getConcept(shortname);

        if (c) {
            SystemConcepts.concepts.set(shortname, c);
            return c;
        }

        // add in DB and return 
        c = await (await DBAdapter.getInstance()).addConcept(new Concept(TemporaryId.create(), Concept.SYSTEM_CONCEPT_CODE_PREFIX + shortname, shortname));

        SystemConcepts.concepts.set(shortname, c);

        return c;

    }
}