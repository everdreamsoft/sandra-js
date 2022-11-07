"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.Entity = void 0;
var SystemConcepts_1 = require("./SystemConcepts");
var Triplet_1 = require("./Triplet");
var Entity = /** @class */ (function () {
    function Entity() {
        this.triplets = [];
        this.references = [];
        this.pushedStatus = false;
    }
    Entity.prototype.setSubject = function (subject) { this.subject = subject; };
    Entity.prototype.setRefs = function (refs) { this.references = refs; };
    Entity.prototype.setUniqueRefConcept = function (c) { this.uniqueRefConcept = c; };
    Entity.prototype.setFactory = function (factory) { this.factory = factory; };
    Entity.prototype.setPushedStatus = function (status) { this.pushedStatus = status; };
    Entity.prototype.getSubject = function () { return this.subject; };
    Entity.prototype.getTriplets = function () { return this.triplets; };
    Entity.prototype.getRefs = function () { return this.references; };
    Entity.prototype.getFactory = function () { return this.factory; };
    Entity.prototype.getPushedStatus = function () { return this.pushedStatus; };
    Entity.prototype.brother = function (verb, target, refs) {
        if (refs === void 0) { refs = null; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = this.addTriplet;
                        return [4 /*yield*/, SystemConcepts_1.SystemConcepts.get(verb)];
                    case 1:
                        _b = [_c.sent()];
                        return [4 /*yield*/, SystemConcepts_1.SystemConcepts.get(target)];
                    case 2: return [4 /*yield*/, _a.apply(this, _b.concat([_c.sent(), refs]))];
                    case 3: return [2 /*return*/, _c.sent()];
                }
            });
        });
    };
    Entity.prototype.join = function (verb, entity, refs) {
        if (refs === void 0) { refs = null; }
        return __awaiter(this, void 0, void 0, function () {
            var t, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.addTriplet;
                        return [4 /*yield*/, SystemConcepts_1.SystemConcepts.get(verb)];
                    case 1: return [4 /*yield*/, _a.apply(this, [_b.sent(), entity.getSubject(), refs])];
                    case 2:
                        t = _b.sent();
                        t.setJoinedEntity(entity);
                        return [2 /*return*/, t];
                }
            });
        });
    };
    Entity.prototype.addTriplet = function (verb, target, refs) {
        if (refs === void 0) { refs = null; }
        return __awaiter(this, void 0, void 0, function () {
            var t;
            var _a;
            return __generator(this, function (_b) {
                t = new Triplet_1.Triplet(-1, this.subject, verb, target);
                this.triplets.push(t);
                if (refs && (refs === null || refs === void 0 ? void 0 : refs.length) > 0) {
                    refs.forEach(function (ref) { return ref.setTripletLink(t); });
                    (_a = this.references).push.apply(_a, __spreadArray([], __read(refs), false));
                }
                return [2 /*return*/, t];
            });
        });
    };
    Entity.prototype.isEqualTo = function (entity) {
        var _this = this;
        // Check the entity triplets is_a and contained_in_file 
        var tripets1 = entity.getTriplets();
        var tripets2 = this.getTriplets();
        // Compare if they are same
        var is_a_triplet1 = tripets1.find(function (t) { return t.getVerb().getShortname() === "is_a"; });
        var is_a_triplet2 = tripets2.find(function (t) { return t.getVerb().getShortname() === "is_a"; });
        if (is_a_triplet1.getTarget().getShortname() != is_a_triplet2.getTarget().getShortname())
            return false;
        var contained_in_file1 = tripets1.find(function (t) { return t.getVerb().getShortname() === "contained_in_file"; });
        var contained_in_file2 = tripets2.find(function (t) { return t.getVerb().getShortname() === "contained_in_file"; });
        if (contained_in_file1.getTarget().getShortname() != contained_in_file2.getTarget().getShortname())
            return false;
        var refs1 = entity.getRefs();
        var refs2 = this.references;
        var uniqueRef1 = refs1.find(function (ref) { return ref.getIdConcept().isSame(_this.uniqueRefConcept); });
        var uniqueRef2 = refs2.find(function (ref) { return ref.getIdConcept().isSame(_this.uniqueRefConcept); });
        if (uniqueRef1 && uniqueRef2)
            return uniqueRef1.isEqualTo(uniqueRef2);
        return false;
    };
    return Entity;
}());
exports.Entity = Entity;
//# sourceMappingURL=Entity.js.map