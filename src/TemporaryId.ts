
export class TemporaryId {

    private static counter = 0;

    constructor() {
    }

    static getCount() {
        return TemporaryId.counter;
    }
    
    static reset() {
        TemporaryId.counter = 0;
    }

    static create(): string {
        TemporaryId.counter = TemporaryId.counter + 1;
        return "temp-" + (TemporaryId.counter);
    }

    static isValid(id: string): boolean {
        return String(id).includes("temp-");
    }



}