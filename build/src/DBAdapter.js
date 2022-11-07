"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.__esModule = true;
exports.DBAdapter = void 0;
var mariaDb = __importStar(require("mariadb"));
var Concept_1 = require("./Concept");
var Reference_1 = require("./Reference");
var Triplet_1 = require("./Triplet");
var Utils_1 = require("./Utils");
var DBAdapter = /** @class */ (function () {
    function DBAdapter(config) {
        this.tables = new Map();
        this.config = config;
        this.tables.set("concepts", this.config.env + "_SandraConcept");
        this.tables.set("references", this.config.env + "_SandraReferences");
        this.tables.set("triplets", this.config.env + "_SandraTriplets");
    }
    DBAdapter.getInstance = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!DBAdapter.instance) return [3 /*break*/, 2];
                        DBAdapter.instance = new DBAdapter(Utils_1.Utils.getDBConfig());
                        return [4 /*yield*/, DBAdapter.instance.connect()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, DBAdapter.instance];
                }
            });
        });
    };
    DBAdapter.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        _a = this;
                        return [4 /*yield*/, mariaDb.createConnection(this.config)];
                    case 1:
                        _a.connection = _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _b.sent();
                        console.error(e_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DBAdapter.prototype.getConnection = function () {
        if (this.connection)
            return this.connection;
        else
            throw Error("DB not connected");
    };
    DBAdapter.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            var e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (!this.connection) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.connection.end()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [3 /*break*/, 4];
                    case 3:
                        e_2 = _a.sent();
                        console.error(e_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    DBAdapter.prototype.getReferenceByTriplet = function (t) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, res, refs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "select r.id, c.id as cId, c.code, c.shortname, r.value from " + this.tables.get("references") + " as r " +
                            " join " + this.tables.get("concepts") + " as c on r.idConcept = c.id and r.linkReferenced = ?";
                        return [4 /*yield*/, this.getConnection().query(sql, [t.getId()])];
                    case 1:
                        res = _a.sent();
                        refs = [];
                        if ((res === null || res === void 0 ? void 0 : res.length) > 0) {
                            res.forEach(function (row) {
                                refs.push(new Reference_1.Reference(row.id, new Concept_1.Concept(row.cId, row.code, row.shortname), t, row.value));
                            });
                        }
                        return [2 /*return*/, refs];
                }
            });
        });
    };
    /**
     *  Get the triplet attached with given verb and target linked to given reference
     */
    DBAdapter.prototype.getEntityTriplet = function (verb, target, ref) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, res, triplets;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "select t.id, c.id as subjectId, c.code as subjectCode, c.shortname as subjectShortname, t.idConceptLink as verb, t.idConceptTarget as target from " + this.tables.get("triplets") + " as t join  " + this.tables.get("references") + " as r" +
                            " on t.id = r.linkReferenced and t.idConceptLink = ? and t.idConceptTarget = ? and r.value = ? and" +
                            " r.idConcept = ? join " + this.tables.get("concepts") + " as c on t.idConceptStart = c.id";
                        return [4 /*yield*/, this.getConnection().query(sql, [verb.getId(), target.getId(), ref.getValue(), ref.getIdConcept().getId()])];
                    case 1:
                        res = _a.sent();
                        triplets = [];
                        if ((res === null || res === void 0 ? void 0 : res.length) > 0) {
                            res.forEach(function (row) {
                                triplets.push(new Triplet_1.Triplet(res[0].id, new Concept_1.Concept(res[0].subjectId, res[0].subjectCode, res[0].subjectShortname), verb, target));
                            });
                        }
                        return [2 /*return*/, triplets];
                }
            });
        });
    };
    DBAdapter.prototype.getTripletsBySubject = function (subject) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, res, triplets;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "SELECT t.id as id, " +
                            "c.id as subId, c.code as subCode , c.shortname as subSn, " +
                            "c1.id as verbId, c1.code as verbCode , c1.shortname as verbSn, " +
                            "c2.id as targetId, c2.code as targetCode , c2.shortname as targetSn from " +
                            this.tables.get("triplets") + " as t join " +
                            this.tables.get("concepts") + " as c on " +
                            "c.id = t.idConceptStart and  t.idConceptStart = ? " +
                            "join " + this.tables.get("concepts") + " as c1 on c1.id = t.idConceptLink " +
                            "join " + this.tables.get("concepts") + " as c2 on c2.id = t.idConceptTarget";
                        return [4 /*yield*/, this.getConnection().query(sql, [subject.getId()])];
                    case 1:
                        res = _a.sent();
                        triplets = [];
                        if ((res === null || res === void 0 ? void 0 : res.length) > 0) {
                            res.forEach(function (row) {
                                triplets.push(new Triplet_1.Triplet(row.id, new Concept_1.Concept(row.subId, row.subCode, row.subSn), new Concept_1.Concept(row.verbId, row.verbCode, row.verbSn), new Concept_1.Concept(row.targetId, row.targetCode, row.targetSn)));
                            });
                        }
                        return [2 /*return*/, triplets];
                }
            });
        });
    };
    /*
       async getTripletByRefVal(refValue: string, refShortname: string, verb: string, target: string): Promise<Triplet> {
   
           let sqlConcepts = "select id, code, shortname from " + this.tables.get("concepts") + "  where shortname in (?,?,?)";
           let concepts: [] = await this.getConnection().query(sqlConcepts, [refShortname, verb, target]);
   
           let refShortnameConcept: any = ((concepts.find((concept: any) => concept.shortname == refShortname)));
           let verbConcept: any = ((concepts.find((concept: any) => concept.shortname == verb)));
           let targetConcept: any = ((concepts.find((concept: any) => concept.shortname == target)));
   
           if (refShortnameConcept && verbConcept && targetConcept) {
   
               let sql = "select t.id, t.idConceptStart as subject, t.idConceptLink as verb, t.idConceptTarget as target from " + this.tables.get("triplets") + " as t join  " + this.tables.get("references") + " as r" +
                   " on t.id = r.linkReferenced and t.idConceptLink = ? and t.idConceptTarget = ? and r.value = ? and" +
                   " r.idConcept = ?";
   
               let res: any = await this.getConnection().query(sql, [verbConcept.id, targetConcept.id, refValue, refShortnameConcept.id]);
   
               if (res?.length > 0) {
                   return new Triplet(res[0].id,
                       new Concept(res[0].subject, "", ""),
                       new Concept(verbConcept.id, "", verb),
                       new Concept(targetConcept.id, "", target));
               }
   
           }
   
           return null;
   
       }
   
       async getTripletsBySubjectId(subjectId: number) {
   
           let sql = "SELECT t.id as tripletId, t.idConceptStart as Subject, c.code as SubjectCode , " +
               "t.idConceptLink as Verb, c2.shortname as VerbShortname , t.idConceptTarget as target, c3.shortname as TargetShortname FROM " +
               this.tables.get("triplets") + " as t join " +
               this.tables.get("concepts") + " as c on " +
               "c.id = t.idConceptStart and  t.idConceptStart = ? " +
               "join " + this.tables.get("concept") + " as c2 on c2.id = t.idConceptLink " +
               "join " + this.tables.get("concept") + " as c3 on c3.id = t.idConceptTarget";
   
           let res = await this.getConnection().query(sql, [subjectId]);
   
           return res;
   
       }
   
       async getReferencesBySubjectId(subjectId: number) {
              let sql = "SELECT r.*, c.shortname FROM " + this.tables.get("references") + " as r join " +
               this.tables.get("concepts") + " as c on " +
               "c.id = r.idConcept and  r.linkReferenced in " +
               "(select id from " + this.tables.get("triplets") + " as t where idConceptStart = ?);";
           let res = await this.getConnection().query(sql, [subjectId]);
           return res;
   
       }

       
    async insertConcepts(concpets: string[][]) {
        let sql = "insert into " + this.tables.get("concepts") + " (id, code, shortname) values (?,?,?)";
        let res = await this.getConnection().query(sql, concpets);
        return res;
    }
   */
    DBAdapter.prototype.getConceptById = function (conceptId) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "select id, code, shortname from " + this.tables.get("concepts") + " where id = ?";
                        return [4 /*yield*/, this.getConnection().query(sql, [conceptId])];
                    case 1:
                        res = _a.sent();
                        if ((res === null || res === void 0 ? void 0 : res.length) > 0)
                            return [2 /*return*/, new Concept_1.Concept(res[0].id, res[0].code, res[0].shortname)];
                        return [2 /*return*/, undefined];
                }
            });
        });
    };
    DBAdapter.prototype.getConcept = function (shortname) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "select * from " + this.tables.get("concepts") + " where shortname = ?";
                        return [4 /*yield*/, this.getConnection().query(sql, shortname)];
                    case 1:
                        res = _a.sent();
                        if (res && (res === null || res === void 0 ? void 0 : res.length) > 0)
                            return [2 /*return*/, new Concept_1.Concept(res[0].id, res[0].code, res[0].shortname)];
                        return [2 /*return*/, undefined];
                }
            });
        });
    };
    // Get all the entity concepts for this factory, on verb contained_in_file
    DBAdapter.prototype.getEntityConcepts = function (is_a, lastId, limit) {
        return __awaiter(this, void 0, void 0, function () {
            var limitQ, lastIdQ, sql, res, concpets;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        limitQ = "";
                        lastIdQ = "";
                        if (lastId)
                            lastIdQ = " and id < " + lastId + " order by id desc";
                        else {
                            lastIdQ = " order by id desc";
                        }
                        if (limit)
                            limitQ = " limit " + limit;
                        sql = "select id, code, shortname from " + this.tables.get("concepts") + " where code = ? " +
                            " and shortname is null " + lastIdQ + limitQ;
                        return [4 /*yield*/, this.getConnection().query(sql, Concept_1.Concept.ENTITY_CONCEPT_CODE_PREFIX + is_a)];
                    case 1:
                        res = _a.sent();
                        concpets = [];
                        if ((res === null || res === void 0 ? void 0 : res.length) > 0) {
                            res.forEach(function (row) {
                                concpets.push(new Concept_1.Concept(row.id, row.code, row.shortname));
                            });
                        }
                        return [2 /*return*/, concpets];
                }
            });
        });
    };
    DBAdapter.prototype.addConcept = function (c) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "insert into " + this.tables.get("concepts") + " set code = ?, shortname = ?";
                        return [4 /*yield*/, this.getConnection().query(sql, c.getDBArrayFormat(false))];
                    case 1:
                        res = _a.sent();
                        if (res && (res === null || res === void 0 ? void 0 : res.insertId)) {
                            c.setId(Number(res.insertId));
                            return [2 /*return*/, c];
                        }
                        return [2 /*return*/, undefined];
                }
            });
        });
    };
    DBAdapter.prototype.addTriplet = function (t) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "insert into " + this.tables.get("triplets") + " set idConceptStart = ?, idConceptLink = ?, idConceptTarget = ?";
                        return [4 /*yield*/, this.getConnection().query(sql, t.getDBArrayFormat(false))];
                    case 1:
                        res = _a.sent();
                        if (res && (res === null || res === void 0 ? void 0 : res.insertId)) {
                            t.setId(Number(res.insertId));
                            return [2 /*return*/, t];
                        }
                        return [2 /*return*/, undefined];
                }
            });
        });
    };
    DBAdapter.prototype.addRefs = function (ref) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "insert into " + this.tables.get("references") + " set idConcept = ?, linkReferenced = ?, value = ?";
                        return [4 /*yield*/, this.getConnection().query(sql, ref.getDBArrayFormat(false))];
                    case 1:
                        res = _a.sent();
                        if (res && (res === null || res === void 0 ? void 0 : res.insertId)) {
                            ref.setId(Number(res.insertId));
                            return [2 /*return*/, ref];
                        }
                        return [2 /*return*/, undefined];
                }
            });
        });
    };
    DBAdapter.prototype.addRefsBatch = function (refs) {
        return __awaiter(this, void 0, void 0, function () {
            var refData, sql, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        refData = [];
                        refs === null || refs === void 0 ? void 0 : refs.forEach(function (ref) {
                            refData.push(ref.getId(), ref.getIdConcept(), ref.getTripletLink(), ref.getValue());
                        });
                        sql = "insert ignore into " + this.tables.get("references") + " (id, idConcept, linkReferenced, value) values (?, ? ,? ,?)";
                        return [4 /*yield*/, this.getConnection().batch(sql, [refData])];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res];
                }
            });
        });
    };
    DBAdapter.prototype.addConceptsBatch = function (concepts) {
        return __awaiter(this, void 0, void 0, function () {
            var conceptsData, id, sql, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        conceptsData = [];
                        return [4 /*yield*/, this.getMaxConceptId()];
                    case 1:
                        id = _a.sent();
                        concepts === null || concepts === void 0 ? void 0 : concepts.forEach(function (concept) {
                            id = id + 1;
                            conceptsData.push([id, concept.getCode(), concept.getShortname()]);
                        });
                        sql = "insert ignore into " + this.tables.get("concepts") + " (id, code, shortname) values (?, ? ,?)";
                        return [4 /*yield*/, this.getConnection().batch(sql, conceptsData)];
                    case 2:
                        res = _a.sent();
                        return [2 /*return*/, res];
                }
            });
        });
    };
    DBAdapter.prototype.addTripletsBatch = function (triplets) {
        return __awaiter(this, void 0, void 0, function () {
            var tripletsData, sql, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tripletsData = [];
                        triplets === null || triplets === void 0 ? void 0 : triplets.forEach(function (t) {
                            tripletsData.push([t.getDBArrayFormat()]);
                        });
                        sql = "insert ignore into " + this.tables.get("triplets") + " (id, idConceptStart, idConceptLink, idConceptTarget) values (?, ?, ?, ?) ";
                        return [4 /*yield*/, this.getConnection().batch(sql, tripletsData)];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res];
                }
            });
        });
    };
    DBAdapter.prototype.addReferencesBatch = function (refs) {
        return __awaiter(this, void 0, void 0, function () {
            var refsData, sql, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        refsData = [];
                        refs === null || refs === void 0 ? void 0 : refs.forEach(function (r) {
                            refsData.push([r.getDBArrayFormat()]);
                        });
                        sql = "insert ignore into " + this.tables.get("references") + " (id, idConcept, linkReferenced, value) values (?, ?, ?, ?) ";
                        return [4 /*yield*/, this.getConnection().batch(sql, refsData)];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res];
                }
            });
        });
    };
    DBAdapter.prototype.getMaxConceptId = function () {
        return __awaiter(this, void 0, void 0, function () {
            var sql, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "select max(id) as id from " + this.tables.get("concepts");
                        return [4 /*yield*/, this.getConnection().query(sql)];
                    case 1:
                        res = _a.sent();
                        if ((res === null || res === void 0 ? void 0 : res.length) > 0)
                            return [2 /*return*/, res[0].id];
                        return [2 /*return*/, 0];
                }
            });
        });
    };
    return DBAdapter;
}());
exports.DBAdapter = DBAdapter;
//# sourceMappingURL=DBAdapter.js.map