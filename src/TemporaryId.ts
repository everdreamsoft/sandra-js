
export class TemporaryId {

    private static counter = 0;

    constructor() {
    }

    static create(): string {
        TemporaryId.counter = TemporaryId.counter + 1;
        return "temp-" + (TemporaryId.counter);
    }

    static isValid(id: string): boolean {
        return String(id).includes("temp-");
    }



}