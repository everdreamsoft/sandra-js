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
exports.__esModule = true;
exports.Test = void 0;
var EntityFactory_1 = require("../src/EntityFactory");
var SystemConcepts_1 = require("../src/SystemConcepts");
var Utils_1 = require("../src/Utils");
var Test = /** @class */ (function () {
    function Test() {
    }
    Test.prototype.testEntityPush = function () {
        return __awaiter(this, void 0, void 0, function () {
            var planetFactory, _a, _b, moonFactory, _c, _d, _e, _f, _g, _h, _j, _k, e, _l, _m, _o, moon1, _p, _q;
            return __generator(this, function (_r) {
                switch (_r.label) {
                    case 0:
                        console.log("started test");
                        _a = EntityFactory_1.EntityFactory.bind;
                        _b = [void 0, "exo_planet", "exo_planet_file"];
                        return [4 /*yield*/, SystemConcepts_1.SystemConcepts.get("name")];
                    case 1:
                        planetFactory = new (_a.apply(EntityFactory_1.EntityFactory, _b.concat([_r.sent()])))();
                        _c = EntityFactory_1.EntityFactory.bind;
                        _d = [void 0, "moon", "moon_file"];
                        return [4 /*yield*/, SystemConcepts_1.SystemConcepts.get("name")];
                    case 2:
                        moonFactory = new (_c.apply(EntityFactory_1.EntityFactory, _d.concat([_r.sent()])))();
                        _f = (_e = planetFactory).create;
                        return [4 /*yield*/, Utils_1.Utils.createDBReference("name", "earth1")];
                    case 3:
                        _g = [
                            _r.sent()
                        ];
                        return [4 /*yield*/, Utils_1.Utils.createDBReference("age", "3.5B")];
                    case 4: return [4 /*yield*/, _f.apply(_e, [_g.concat([
                                _r.sent()
                            ])])];
                    case 5:
                        _r.sent();
                        _j = (_h = planetFactory).create;
                        return [4 /*yield*/, Utils_1.Utils.createDBReference("name", "venus1")];
                    case 6:
                        _k = [
                            _r.sent()
                        ];
                        return [4 /*yield*/, Utils_1.Utils.createDBReference("age", "3.5B")];
                    case 7: return [4 /*yield*/, _j.apply(_h, [_k.concat([
                                _r.sent()
                            ])])];
                    case 8:
                        _r.sent();
                        _m = (_l = planetFactory).create;
                        return [4 /*yield*/, Utils_1.Utils.createDBReference("name", "earth1")];
                    case 9:
                        _o = [
                            _r.sent()
                        ];
                        return [4 /*yield*/, Utils_1.Utils.createDBReference("age", "3B")];
                    case 10:
                        _o = _o.concat([
                            _r.sent()
                        ]);
                        return [4 /*yield*/, Utils_1.Utils.createDBReference("atmosphere", "yes")];
                    case 11:
                        _o = _o.concat([
                            _r.sent()
                        ]);
                        return [4 /*yield*/, Utils_1.Utils.createDBReference("pressure", "1")];
                    case 12:
                        _o = _o.concat([
                            _r.sent()
                        ]);
                        return [4 /*yield*/, Utils_1.Utils.createDBReference("habitable", "yes")];
                    case 13: return [4 /*yield*/, _m.apply(_l, [_o.concat([
                                _r.sent()
                            ])])];
                    case 14:
                        e = _r.sent();
                        return [4 /*yield*/, e.brother("hasMoon", "yes")];
                    case 15:
                        _r.sent();
                        _q = (_p = moonFactory).create;
                        return [4 /*yield*/, Utils_1.Utils.createDBReference("name", "moon1")];
                    case 16: return [4 /*yield*/, _q.apply(_p, [[_r.sent()]])];
                    case 17:
                        moon1 = _r.sent();
                        return [4 /*yield*/, e.join("moon", moon1)];
                    case 18:
                        _r.sent();
                        return [4 /*yield*/, planetFactory.push()];
                    case 19:
                        _r.sent();
                        console.log("Done");
                        process.exit();
                        return [2 /*return*/];
                }
            });
        });
    };
    Test.prototype.testEnityLoad = function () {
        return __awaiter(this, void 0, void 0, function () {
            var planetFactory, _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _a = EntityFactory_1.EntityFactory.bind;
                        _b = [void 0, "exo_planet", "exo_planet_file"];
                        return [4 /*yield*/, SystemConcepts_1.SystemConcepts.get("name")];
                    case 1:
                        planetFactory = new (_a.apply(EntityFactory_1.EntityFactory, _b.concat([_e.sent()])))();
                        _d = (_c = planetFactory).load;
                        return [4 /*yield*/, Utils_1.Utils.createDBReference("name", "earth")];
                    case 2: return [4 /*yield*/, _d.apply(_c, [_e.sent()])];
                    case 3:
                        _e.sent();
                        console.log("");
                        return [2 /*return*/];
                }
            });
        });
    };
    Test.prototype.testEnityLoadAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var planetFactory, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = EntityFactory_1.EntityFactory.bind;
                        _b = [void 0, "exo_planet", "exo_planet_file"];
                        return [4 /*yield*/, SystemConcepts_1.SystemConcepts.get("name")];
                    case 1:
                        planetFactory = new (_a.apply(EntityFactory_1.EntityFactory, _b.concat([_c.sent()])))();
                        return [4 /*yield*/, planetFactory.loadEntityConcepts(null, "2")];
                    case 2:
                        _c.sent();
                        console.log("");
                        return [2 /*return*/];
                }
            });
        });
    };
    Test.prototype.testBatchPush = function () {
        return __awaiter(this, void 0, void 0, function () {
            var planetFactory, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = EntityFactory_1.EntityFactory.bind;
                        _b = [void 0, "exo_planet", "exo_planet_file"];
                        return [4 /*yield*/, SystemConcepts_1.SystemConcepts.get("name")];
                    case 1:
                        planetFactory = new (_a.apply(EntityFactory_1.EntityFactory, _b.concat([_c.sent()])))();
                        // Creating new entities 
                        return [4 /*yield*/, planetFactory.create([])];
                    case 2:
                        // Creating new entities 
                        _c.sent();
                        return [4 /*yield*/, planetFactory.create([])];
                    case 3:
                        _c.sent();
                        return [4 /*yield*/, planetFactory.create([])];
                    case 4:
                        _c.sent();
                        return [4 /*yield*/, planetFactory.create([])];
                    case 5:
                        _c.sent();
                        return [4 /*yield*/, planetFactory.create([])];
                    case 6:
                        _c.sent();
                        return [4 /*yield*/, planetFactory.create([])];
                    case 7:
                        _c.sent();
                        return [4 /*yield*/, planetFactory.pushBatch()];
                    case 8:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Test.prototype.testJetskiEventsPush = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    return Test;
}());
exports.Test = Test;
var test = new Test();
test.testBatchPush();
//# sourceMappingURL=test.js.map