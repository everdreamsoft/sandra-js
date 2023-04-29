"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemporaryId = void 0;
/**
 * This class keeps a static counter of the temp ids created. These ids are used for concpet,triplet and reference
 * objects when they are created in memory. In order to keep them unique it is implemnted as static.
 */
class TemporaryId {
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
    static create() {
        TemporaryId.counter = TemporaryId.counter + 1;
        return "temp-" + (TemporaryId.counter);
    }
    /**
     *
     * @param id
     * @returns Returns true if the given id is an temp id, checks for "temp-" string in the given id.
     */
    static isValid(id) {
        return String(id).includes("temp-");
    }
}
TemporaryId.counter = 0;
exports.TemporaryId = TemporaryId;
//# sourceMappingURL=TemporaryId.js.map