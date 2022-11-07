import { Concept } from "./Concept";
import { IDBConfig } from "./interfaces/IDBconfig";
import { Reference } from "./Reference";
import { SystemConcepts } from "./SystemConcepts";
import { Triplet } from "./Triplet";

export class Utils {

    static getDBConfig(): IDBConfig {

        return {
            user: "lindt_ranjit",
            database: "lindt_helvetia",
            env: "fondue",
            host: "mysql-lindt.alwaysdata.net",
            password: "",
            multipleStatements: true
        } as IDBConfig;

    }

    static isNullConcept(concept: Concept) {
        return concept.getId() === -999;
    }

    static async createDBReference(shortname: string, value: string, tripletLink: Triplet = null): Promise<Reference> {
        return new Reference(-1, await SystemConcepts.get(shortname), tripletLink, value);
    }

}