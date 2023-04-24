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
            return SystemConcepts.get(concept.getShortname());
        }
        throw new Error("Not a system concpet, trying to push shortname with null value");
    }
    /**
     * Gets the concept with given shortname, it searches given shortname in concepts list
     * if its not found then it tries to get it from the database, if not present in the database
     * it creates a new concept entry in the dabase and also in its list and returns the concpet object.
     */
    static async get(shortname) {
        if (shortname)
            return new Promise((resolve, reject) => {
                // check if it exist in memory 
                let c = SystemConcepts.concepts.get(shortname);
                if (c) {
                    return resolve(c);
                }
                DBAdapter_1.DBAdapter.getInstance().then(db => {
                    db.getConcept(shortname).then(c => {
                        if (c) {
                            SystemConcepts.concepts.set(shortname, c);
                            return resolve(c);
                        }
                        let newConcept = new Concept_1.Concept(TemporaryId_1.TemporaryId.create(), Concept_1.Concept.SYSTEM_CONCEPT_CODE_PREFIX + shortname, shortname);
                        db.addConcept(newConcept).then(c => {
                            if (c) {
                                SystemConcepts.concepts.set(shortname, c);
                                return resolve(c);
                            }
                            return reject(new Error("Unable to get or create system concept with sn - " + shortname));
                        });
                    });
                });
            });
        else
            return Promise.reject(new Error("Shortname can not be undefined for system concepts"));
    }
}
SystemConcepts.concepts = new Map();
exports.SystemConcepts = SystemConcepts;
//# sourceMappingURL=SystemConcepts.js.map