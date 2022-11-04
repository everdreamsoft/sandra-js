import { Concept } from "./Concept";
import { IDBConfig } from "./interfaces/IDBconfig";
import { Reference } from "./Reference";
import { SystemConcepts } from "./SystemConcepts";

export class Utils {

    static getDBConfig(): IDBConfig {

        return {
            user: "lindt_ranjit",
            database: "lindt_helvetia",
            env: "fondue",
            host: "mysql-lindt.alwaysdata.net",
            password: "!!Wak4bewq",
            multipleStatements: true
        } as IDBConfig;

    }


    static createMemoryConcept(code: string, shortname: string): Concept {
        return new Concept(-1, code, shortname);
    }

    static createMemoryReference(shortname: string, value: string): Reference {
        return new Reference(-1, Utils.createMemoryConcept(Concept.SYSTEM_CONCEPT_CODE_PREFIX + shortname, shortname), -1, value);
    }

    static isNullConcept(concept: Concept) {
        return concept.getId() === -999;
    }

    static async createDBReference(shortname: string, value: string, linkConceptId: number = -1): Promise<Reference> {
           return new Reference(-1, await SystemConcepts.get(shortname), linkConceptId, value);
    }

}