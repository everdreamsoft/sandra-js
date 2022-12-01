import { IDBConfig } from "./interfaces/IDBconfig";
import { Reference } from "./Reference";
import { SystemConcepts } from "./SystemConcepts";
import { TemporaryId } from "./TemporaryId";
import { Triplet } from "./Triplet";
import crypto from "crypto";

export class Utils {

    static async createDBReference(shortname: string, value: string, tripletLink: Triplet = null): Promise<Reference> {
        return new Reference(TemporaryId.create(), await SystemConcepts.get(shortname), tripletLink, value);
    }

    static getHash(value: string) {
        return crypto.createHash('md5').update(value).digest("hex");
    }

    static wait(milliseconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

}