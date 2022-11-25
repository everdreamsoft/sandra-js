"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemporaryId = void 0;
class TemporaryId {
    constructor() {
    }
    static getCount() {
        return TemporaryId.counter;
    }
    static reset() {
        TemporaryId.counter = 0;
    }
    static create() {
        TemporaryId.counter = TemporaryId.counter + 1;
        return "temp-" + (TemporaryId.counter);
    }
    static isValid(id) {
        return String(id).includes("temp-");
    }
}
exports.TemporaryId = TemporaryId;
TemporaryId.counter = 0;
//# sourceMappingURL=TemporaryId.js.map