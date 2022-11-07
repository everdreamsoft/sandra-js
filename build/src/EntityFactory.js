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
exports.EntityFactory = void 0;
var Concept_1 = require("./Concept");
var DBAdapter_1 = require("./DBAdapter");
var Entity_1 = require("./Entity");
var SystemConcepts_1 = require("./SystemConcepts");
var EntityFactory = /** @class */ (function () {
    function EntityFactory(is_a, contained_in_file, uniqueRefConcept) {
        this.entityArray = [];
        this.is_a = is_a;
        this.contained_in_file = contained_in_file;
        this.uniqueRefConcept = uniqueRefConcept;
    }
    EntityFactory.prototype.create = function (refs) {
        return __awaiter(this, void 0, void 0, function () {
            var e, subConcept;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        e = new Entity_1.Entity();
                        subConcept = new Concept_1.Concept(-1, Concept_1.Concept.ENTITY_CONCEPT_CODE_PREFIX + this.getIsAVerb(), null);
                        e.setFactory(this);
                        e.setSubject(subConcept);
                        // Set unique ref concept
                        e.setUniqueRefConcept(this.uniqueRefConcept);
                        // Adding is_a verb triplet
                        return [4 /*yield*/, e.brother("is_a", this.is_a)];
                    case 1:
                        // Adding is_a verb triplet
                        _a.sent();
                        // Adding contained_in_file triplet
                        return [4 /*yield*/, e.brother("contained_in_file", this.contained_in_file, refs)];
                    case 2:
                        // Adding contained_in_file triplet
                        _a.sent();
                        // Adding it to the factory list
                        this.add(e);
                        return [2 /*return*/, e];
                }
            });
        });
    };
    EntityFactory.prototype.getIsAVerb = function () {
        return this.is_a;
    };
    EntityFactory.prototype.getContainedInFileVerb = function () {
        return this.contained_in_file;
    };
    EntityFactory.prototype.isSame = function (factory) {
        return this.is_a == factory.getIsAVerb() && this.contained_in_file == factory.getContainedInFileVerb();
    };
    EntityFactory.prototype.getUniqueRefConcept = function () {
        return this.uniqueRefConcept;
    };
    EntityFactory.prototype.add = function (entity) {
        if (this.uniqueRefConcept && this.uniqueRefConcept.getShortname().length > 0) {
            var index = this.entityArray.findIndex(function (e) { return e.isEqualTo(entity); });
            if (index >= 0) {
                this.entityArray[index] = entity;
            }
            else {
                this.entityArray.push(entity);
            }
        }
        else
            this.entityArray.push(entity);
    };
    // Pushing entities to database, without batch insertion //
    EntityFactory.prototype.push = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var index, entity, indexTriplet, t, indexRef;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        index = 0;
                        _b.label = 1;
                    case 1:
                        if (!(index < ((_a = this.entityArray) === null || _a === void 0 ? void 0 : _a.length))) return [3 /*break*/, 17];
                        entity = this.entityArray[index];
                        if (entity.getPushedStatus()) {
                            return [3 /*break*/, 16];
                        }
                        return [4 /*yield*/, DBAdapter_1.DBAdapter.getInstance()];
                    case 2: 
                    // Create subject 
                    return [4 /*yield*/, (_b.sent()).addConcept(entity.getSubject())];
                    case 3:
                        // Create subject 
                        _b.sent();
                        indexTriplet = 0;
                        _b.label = 4;
                    case 4:
                        if (!(indexTriplet < entity.getTriplets().length)) return [3 /*break*/, 10];
                        t = entity.getTriplets()[indexTriplet];
                        if (!t.getJoinedEntity()) return [3 /*break*/, 6];
                        return [4 /*yield*/, t.getJoinedEntity().getFactory().push()];
                    case 5:
                        _b.sent();
                        _b.label = 6;
                    case 6: return [4 /*yield*/, DBAdapter_1.DBAdapter.getInstance()];
                    case 7: return [4 /*yield*/, (_b.sent()).addTriplet(t)];
                    case 8:
                        _b.sent();
                        _b.label = 9;
                    case 9:
                        indexTriplet++;
                        return [3 /*break*/, 4];
                    case 10:
                        indexRef = 0;
                        _b.label = 11;
                    case 11:
                        if (!(indexRef < entity.getRefs().length)) return [3 /*break*/, 15];
                        return [4 /*yield*/, DBAdapter_1.DBAdapter.getInstance()];
                    case 12: return [4 /*yield*/, (_b.sent()).addRefs(entity.getRefs()[indexRef])];
                    case 13:
                        _b.sent();
                        _b.label = 14;
                    case 14:
                        indexRef++;
                        return [3 /*break*/, 11];
                    case 15:
                        entity.setPushedStatus(true);
                        _b.label = 16;
                    case 16:
                        index++;
                        return [3 /*break*/, 1];
                    case 17: return [2 /*return*/];
                }
            });
        });
    };
    EntityFactory.prototype.pushBatch = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var concepts, index, e;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        concepts = [];
                        for (index = 0; index < ((_a = this.entityArray) === null || _a === void 0 ? void 0 : _a.length); index++) {
                            e = this.entityArray[index];
                            concepts.push(e.getSubject());
                        }
                        return [4 /*yield*/, DBAdapter_1.DBAdapter.getInstance()];
                    case 1: return [4 /*yield*/, (_b.sent()).addConceptsBatch(concepts)];
                    case 2:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Loads all entities with the given reference 
    EntityFactory.prototype.load = function (ref) {
        return __awaiter(this, void 0, void 0, function () {
            var entityTriplets, _a, _b, _c, index, entityTriplet, refs, triplets, i, r, e;
            var _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, DBAdapter_1.DBAdapter.getInstance()];
                    case 1:
                        _b = (_a = (_f.sent())).getEntityTriplet;
                        return [4 /*yield*/, SystemConcepts_1.SystemConcepts.get("contained_in_file")];
                    case 2:
                        _c = [_f.sent()];
                        return [4 /*yield*/, SystemConcepts_1.SystemConcepts.get(this.contained_in_file)];
                    case 3: return [4 /*yield*/, _b.apply(_a, _c.concat([_f.sent(), ref]))];
                    case 4:
                        entityTriplets = _f.sent();
                        index = 0;
                        _f.label = 5;
                    case 5:
                        if (!(index < (entityTriplets === null || entityTriplets === void 0 ? void 0 : entityTriplets.length))) return [3 /*break*/, 14];
                        entityTriplet = entityTriplets[index];
                        refs = [];
                        return [4 /*yield*/, DBAdapter_1.DBAdapter.getInstance()];
                    case 6: return [4 /*yield*/, (_f.sent()).getTripletsBySubject(entityTriplet.getSubject())];
                    case 7:
                        triplets = _f.sent();
                        i = 0;
                        _f.label = 8;
                    case 8:
                        if (!(i < triplets.length)) return [3 /*break*/, 12];
                        return [4 /*yield*/, DBAdapter_1.DBAdapter.getInstance()];
                    case 9: return [4 /*yield*/, (_f.sent()).getReferenceByTriplet(triplets[i])];
                    case 10:
                        r = _f.sent();
                        refs.push.apply(refs, __spreadArray([], __read(r), false));
                        _f.label = 11;
                    case 11:
                        i++;
                        return [3 /*break*/, 8];
                    case 12:
                        e = new Entity_1.Entity();
                        e.setSubject(entityTriplet.getSubject());
                        (_d = e.getTriplets()).push.apply(_d, __spreadArray([], __read(triplets), false));
                        (_e = e.getRefs()).push.apply(_e, __spreadArray([], __read(refs), false));
                        e.setUniqueRefConcept(this.uniqueRefConcept);
                        this.add(e);
                        _f.label = 13;
                    case 13:
                        index++;
                        return [3 /*break*/, 5];
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    EntityFactory.prototype.loadEntityConcepts = function (lastId, limit) {
        return __awaiter(this, void 0, void 0, function () {
            var entityConcepts, index, entityConcept, e;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, DBAdapter_1.DBAdapter.getInstance()];
                    case 1: return [4 /*yield*/, (_a.sent()).getEntityConcepts(this.is_a, lastId, limit)];
                    case 2:
                        entityConcepts = _a.sent();
                        for (index = 0; index < (entityConcepts === null || entityConcepts === void 0 ? void 0 : entityConcepts.length); index++) {
                            entityConcept = entityConcepts[index];
                            e = new Entity_1.Entity();
                            e.setSubject(entityConcept);
                            e.setUniqueRefConcept(this.uniqueRefConcept);
                            this.entityArray.push(e);
                        }
                        console.log("");
                        return [2 /*return*/];
                }
            });
        });
    };
    return EntityFactory;
}());
exports.EntityFactory = EntityFactory;
//# sourceMappingURL=EntityFactory.js.map