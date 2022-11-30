import { IDBConfig } from "./interfaces/IDBconfig";
import { Reference } from "./Reference";
import { SystemConcepts } from "./SystemConcepts";
import { TemporaryId } from "./TemporaryId";
import { Triplet } from "./Triplet";
import crypto from "crypto";

export class Utils {

    static getDBConfig(): IDBConfig {

        // return {
        //     user: "lindt_ranjit",
        //     database: "lindt_helvetia",
        //     env: "fondue",
        //     host: "mysql-lindt.alwaysdata.net",
        //     password: "!!Wak4bewq",
        //     multipleStatements: true
        // } as IDBConfig;

        return {
            user: "root",
            database: "ccc8",
            env: "bsc",
            host: "localhost",
            password: "",
            multipleStatements: true
        } as IDBConfig;

    }

    static async createDBReference(shortname: string, value: string, tripletLink: Triplet = null): Promise<Reference> {
        return new Reference(TemporaryId.create(), await SystemConcepts.get(shortname), tripletLink, value);
    }

    static getHash(value: string) {
        return crypto.createHash('md5').update(value).digest("hex");
    }

}