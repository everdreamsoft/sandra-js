export class DataStorage {

    private value: string;
    private upsert: boolean;

    constructor(value: string, upsert: boolean = false) {
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
    setValue(val: string) { this.value = val; }

    setUpsert(val: boolean) {
        this.upsert = val;
    }
}