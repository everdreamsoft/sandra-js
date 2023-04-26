"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataStorage = void 0;
class DataStorage {
    constructor(value, upsert = false) {
        this.value = value;
        this.upsert = upsert;
    }
    /**
   *
   * @returns Returns value
   */
    getValue() { return this.value; }
    /**
    *
    * @returns Returns true if reference is marked for update for push queries
    */
    isUpsert() {
        return this.upsert;
    }
    /**
     * Sets value
     * @param val
     */
    setValue(val) { this.value = val; }
    setUpsert(val) {
        this.upsert = val;
    }
}
exports.DataStorage = DataStorage;
//# sourceMappingURL=DataStorage.js.map