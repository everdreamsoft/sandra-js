"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConcepts = void 0;
const Concept_1 = require("./Concept");
const DBAdapter_1 = require("./DBAdapter");
const TemporaryId_1 = require("./TemporaryId");
/**
 * This class keeps all the system concpets in memory for efficency. Uses static object to keep the
 * list of system concepts. Always use this class to get system concepts.
 */
class SystemConcepts {
    constructor() {
    }
    static async add(concept) {
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
    static async get(shortname) {
        // check if it exist in memory 
        let c = SystemConcepts.concepts.get(shortname);
        if (c) {
            return c;
        }
        // check if exist in DB
        c = await (await DBAdapter_1.DBAdapter.getInstance()).getConcept(shortname);
        if (c) {
            SystemConcepts.concepts.set(shortname, c);
            return c;
        }
        // add in DB and return 
        c = await (await DBAdapter_1.DBAdapter.getInstance()).addConcept(new Concept_1.Concept(TemporaryId_1.TemporaryId.create(), Concept_1.Concept.SYSTEM_CONCEPT_CODE_PREFIX + shortname, shortname));
        SystemConcepts.concepts.set(shortname, c);
        return c;
    }
}
SystemConcepts.concepts = new Map();
exports.SystemConcepts = SystemConcepts;
//# sourceMappingURL=SystemConcepts.js.map