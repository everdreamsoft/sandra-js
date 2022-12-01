import { IDBConfig } from "./interfaces/IDBconfig";
import { Reference } from "./Reference";
import { SystemConcepts } from "./SystemConcepts";
import { TemporaryId } from "./TemporaryId";
import { Triplet } from "./Triplet";
import crypto from "crypto";
import { Sandra } from "./Sandra";

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

    static createIPFSUrlIfFound(url: string) {
        const IPFS_PREFIX = "ipfs://";
        url = url?.toLowerCase();

        if (url?.indexOf(IPFS_PREFIX) >= 0) {
            if (Sandra.APP_CONFIG.IPFSServiceUrl)
                return url.replace(IPFS_PREFIX, Sandra.APP_CONFIG.IPFSServiceUrl);
            else
                throw new Error("IPFS service url not configured in snadra, Use Sandra.APP_CONFIG");
        }

        return url;

    }
}