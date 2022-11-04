import { Concept } from "./Concept";
import { IDBConfig } from "./interfaces/IDBconfig";
import { Reference } from "./Reference";

export class Utils {

    static getDBConfig(): IDBConfig {

        return {
            user: "lindt_ranjit",
            database: "lindt_helvetia",
            env: "fondue",
            host: "mysql-lindt.alwaysdata.net",
            password: "!!Wak4bewq"
        } as IDBConfig;

    }


    static createMemoryConcept(shortname: string): Concept {
        return new Concept(-1, "system concept " + shortname, shortname);
    }

    static createMemoryReference(shortname: string, value: string): Reference {
        return new Reference(-1, Utils.createMemoryConcept(shortname), -1, value);
    }

    static isNullConcept(concept: Concept) {
        return concept.getId() === -999;
    }

}