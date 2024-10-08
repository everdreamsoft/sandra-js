import crypto from "crypto";
import { Sandra } from "../Sandra";
import { Reference } from "../models/Reference";
import { SystemConcepts } from "../models/SystemConcepts";
import { Triplet } from "../models/Triplet";
import { TemporaryId } from "./TemporaryId";

export class Common {

    /**
     * 
     * @param shortname 
     * @param value 
     * @param tripletLink 
     * @returns Returns a new Reference object with given shortname, value and triplet link  
     */
    static async createDBReference(shortname: string, value: string, tripletLink: Triplet | undefined = undefined, server: string): Promise<Reference> {
        return new Reference(TemporaryId.create(), await SystemConcepts.get(shortname, server), tripletLink, value);
    }

    /**
     * 
     * @param value 
     * @returns Returns 'md5' hash for given value 
     */
    static getHash(value: string) {
        return crypto.createHash('md5').update(value).digest("hex");
    }

    /**
     * Sleep for give millisecods
     * @param milliseconds 
     * @returns 
     */
    static wait(milliseconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    /**
     * 
     * @param url Original IPFS url
     * @returns Replaces ipfs url with corresponding IPFS service url in config file Sandra.APP_CONFIG.IPFSServiceUrl
     * If url is not IPFS then returns same url back.
     */
    static createIPFSUrlIfFound(url: string) {

        if (url?.toLowerCase().indexOf("ipfs://") >= 0) {

            if (Sandra.APP_CONFIG.IPFSServiceUrl) {

                if (url?.toLowerCase().indexOf("ipfs://ipfs/") >= 0) {
                    return url.replace(/ipfs:\/\/ipfs\//i, Sandra.APP_CONFIG.IPFSServiceUrl);
                }

                if (url?.toLowerCase().indexOf("ipfs://") >= 0) {
                    return url.replace(/ipfs:\/\//i, Sandra.APP_CONFIG.IPFSServiceUrl);
                }
            }
            else
                throw new Error("IPFS service url not configured in snadra, Use Sandra.APP_CONFIG");

        }

        return url;

    }
}