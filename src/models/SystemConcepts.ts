import { SandraAdapter } from "../adapters/SandraAdapter";
import { DB } from "../connections/DB";
import { TemporaryId } from "../utils/TemporaryId";
import { Concept } from "./Concept";


/**
 * This class keeps all the system concpets in memory for efficency. Uses static object to keep the 
 * list of system concepts. Always use this class to get system concepts.
 */
export class SystemConcepts {

    private static servers: Map<string, Map<string, Concept>> = new Map();

    /**
     * Gets system concpets for perticular server 
     * @param server name of the server 
     * @returns concpets maps
     */
    private static getServerConcepts(server: string): Map<string, Concept> {

        let concepts: Map<string, Concept> | undefined = SystemConcepts.servers.get(server);

        if (concepts)
            return concepts;

        concepts = new Map();

        SystemConcepts.servers.set(server, concepts);
        return concepts;

    }

    /**
     * Gets the concept with given shortname, it searches given shortname in concepts list 
     * if its not found then it tries to get it from the database, if not present in the database
     * it creates a new concept entry in the dabase and also in its list and returns the concpet object. 
     */
    static async get(shortname: string | undefined, server: string): Promise<Concept> {

        if (shortname)

            return new Promise((resolve, reject) => {

                let serverConceptsMap = SystemConcepts.getServerConcepts(server);

                // check if it exist in memory 
                let c = serverConceptsMap.get(shortname);

                if (c) {
                    return resolve(c);
                }

                let db = DB.getInstance().server(server) as SandraAdapter;

                db.getConcept(shortname).then(c => {

                    if (c) {
                        serverConceptsMap.set(shortname, c);
                        return resolve(c);
                    }

                    let newConcept = new Concept(TemporaryId.create(), Concept.SYSTEM_CONCEPT_CODE_PREFIX + shortname, shortname);

                    db.addConcept(newConcept).then(c => {

                        if (c) {
                            serverConceptsMap.set(shortname, c);
                            return resolve(c);
                        }

                        return reject(new Error("Unable to get or create system concept with sn - " + shortname));

                    })

                });

            });
        else
            return Promise.reject(new Error("Shortname can not be undefined for system concepts"))

    }


}