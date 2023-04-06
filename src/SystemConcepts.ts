import { Concept } from "./Concept";
import { DBAdapter } from "./DBAdapter";
import { TemporaryId } from "./TemporaryId";

/**
 * This class keeps all the system concpets in memory for efficency. Uses static object to keep the 
 * list of system concepts. Always use this class to get system concepts.
 */
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

    /**
     * Gets the concept with given shortname, it searches given shortname in concepts list 
     * if its not found then it tries to get it from the database, if not present in the database
     * it creates a new concept entry in the dabase and also in its list and returns the concpet object. 
     */
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