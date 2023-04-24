/**
 * This class keeps a static counter of the temp ids created. These ids are used for concpet,triplet and reference
 * objects when they are created in memory. In order to keep them unique it is implemnted as static.
 */
export class TemporaryId {

    private static counter = 0;

    constructor() {
    }

    /**
     * 
     * @returns Returns total Ids generated
     */
    static getCount() {
        return TemporaryId.counter;
    }

    /**
     * Resets temp id created to 0
     */
    static reset() {
        TemporaryId.counter = 0;
    }

    /**
     * 
     * @returns Returns temp id with an incremental counter
     */
    static create(): string {
        TemporaryId.counter = TemporaryId.counter + 1;
        return "temp-" + (TemporaryId.counter);
    }

    /**
     * 
     * @param id 
     * @returns Returns true if the given id is an temp id, checks for "temp-" string in the given id.
     */
    static isValid(id: string): boolean {
        return String(id).includes("temp-");
    }


}