"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConcepts = void 0;
const Concept_1 = require("./Concept");
const DBAdapter_1 = require("./DBAdapter");
const TemporaryId_1 = require("./TemporaryId");
class SystemConcepts {
    constructor() {
    }
    static async add(concept) {
        if (concept.getShortname()) {
            return await SystemConcepts.get(concept.getShortname());
        }
        throw new Error("Not a system concpet, trying to push shortname with null value");
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
        c = await (await DBAdapter_1.DBAdapter.getInstance()).addConcept(new Concept_1.Concept(TemporaryId_1.TemporaryId.create(), Concept_1.Concept.SYSTEM_CONCEPT_CODE_PREFIX + shortname, shortname));
        SystemConcepts.concepts.push(c);
        return c;
    }
}
exports.SystemConcepts = SystemConcepts;
SystemConcepts.concepts = [];
//# sourceMappingURL=SystemConcepts.js.map