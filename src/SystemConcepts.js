"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConcepts = void 0;
const Concept_1 = require("./Concept");
const DBAdapter_1 = require("./DBAdapter");
class SystemConcepts {
    constructor() {
    }
    static add(concept) {
        if (concept.getShortname()) {
            // Check if it exist
            let i = SystemConcepts.concepts.findIndex(c => concept.isSame(concept));
            if (i >= 0)
                return SystemConcepts.concepts[i];
        }
        throw new Error("Not a system concpet, trying to push shortname with null value");
    }
    static async load(shortname) {
        let c = await (await DBAdapter_1.DBAdapter.getInstance()).getConcept(shortname);
        SystemConcepts.concepts.push(c);
        return c;
    }
    static async get(shortname) {
        // check if it exist in memory 
        let c = SystemConcepts.concepts.find(concept => {
            return concept.getShortname() === shortname;
        });
        if (c) {
            return c;
        }
        // check if exist in DB
        c = await (await DBAdapter_1.DBAdapter.getInstance()).getConcept(shortname);
        if (c) {
            SystemConcepts.concepts.push(c);
            return c;
        }
        // add in DB and return 
        c = await (await DBAdapter_1.DBAdapter.getInstance()).addConcept(new Concept_1.Concept(-1, Concept_1.Concept.SYSTEM_CONCEPT_CODE_PREFIX + shortname, shortname));
        return c;
    }
}
exports.SystemConcepts = SystemConcepts;
SystemConcepts.concepts = [];
//# sourceMappingURL=SystemConcepts.js.map