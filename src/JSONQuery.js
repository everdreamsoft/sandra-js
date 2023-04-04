"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONQuery = void 0;
const Concept_1 = require("./Concept");
const EntityFactory_1 = require("./EntityFactory");
const SystemConcepts_1 = require("./SystemConcepts");
const TemporaryId_1 = require("./TemporaryId");
const Triplet_1 = require("./Triplet");
const Utils_1 = require("./Utils");
class JSONQuery {
    constructor() {
    }
    // Example template for a query as json 
    static async getTemplate() {
        return JSONQuery.TEMPLATE;
    }
    static async select(query) {
        return JSONQuery.QueryJSON(query);
    }
    static async selectAsJson(query) {
        let res = await JSONQuery.QueryJSON(query);
        let jsonRes = [];
        res.forEach(e => {
            jsonRes.push(e.asJSON());
        });
        return Promise.resolve(jsonRes);
    }
    static async push(data) {
        throw new Error("Function not implemented");
    }
    static async QueryJSON(json, level = 0) {
        var _a;
        let limit = 1;
        if (level == 0)
            limit = json.options.limit;
        let uniqueRefConcept = await SystemConcepts_1.SystemConcepts.get(json["uniqueRef"]);
        let factory = new EntityFactory_1.EntityFactory(json["is_a"], json["contained_in_file"], uniqueRefConcept);
        let subConcept = new Concept_1.Concept(TemporaryId_1.TemporaryId.create(), Concept_1.Concept.ENTITY_CONCEPT_CODE_PREFIX + factory.getIsAVerb(), null);
        let cFile = await SystemConcepts_1.SystemConcepts.get(json["contained_in_file"]);
        let sysCiF = await SystemConcepts_1.SystemConcepts.get("contained_in_file");
        let t2 = new Triplet_1.Triplet(TemporaryId_1.TemporaryId.create(), subConcept, sysCiF, cFile);
        let refsArr = [];
        let refKeys = Object.keys(json.refs);
        for (let i = 0; i < refKeys.length; i++) {
            let ref = await Utils_1.Utils.createDBReference(refKeys[i], json.refs[refKeys[i]], t2);
            refsArr.push(ref);
        }
        let tripletsArr = [t2];
        let tripletsKeys = Object.keys(json.brothers);
        for (let i = 0; i < tripletsKeys.length; i++) {
            tripletsArr.push(new Triplet_1.Triplet(TemporaryId_1.TemporaryId.create(), subConcept, await SystemConcepts_1.SystemConcepts.get(tripletsKeys[i]), await SystemConcepts_1.SystemConcepts.get(json.brothers[tripletsKeys[i]])));
        }
        let joinedKeys = Object.keys(json.joined);
        for (let i = 0; i < (joinedKeys === null || joinedKeys === void 0 ? void 0 : joinedKeys.length); i++) {
            let verbConcept = await SystemConcepts_1.SystemConcepts.get(joinedKeys[i]);
            let targets = await this.QueryJSON(json.joined[joinedKeys[i]], level + 1);
            if ((targets === null || targets === void 0 ? void 0 : targets.length) > 0) {
                let triplet = new Triplet_1.Triplet(TemporaryId_1.TemporaryId.create(), subConcept, verbConcept, targets[0].getSubject());
                triplet.setJoinedEntity(targets[0]);
                tripletsArr.push(triplet);
            }
            else {
                return [];
            }
        }
        await factory.filter(tripletsArr, refsArr, limit);
        console.log(level + " count - " + ((_a = factory.getEntities()) === null || _a === void 0 ? void 0 : _a.length));
        if (json.options.load_data) {
            await factory.loadTriplets(true);
            await factory.loadAllTripletRefs();
        }
        return Promise.resolve(factory.getEntities());
    }
}
exports.JSONQuery = JSONQuery;
JSONQuery.TEMPLATE = {
    "is_a": "planet",
    "contained_in_file": "planet_file",
    "uniqueRef": "name",
    "refs": {
        "name": "planet1"
    },
    "brothers": {
        "hasMoon": "true"
    },
    "joined": {
        "moon": {
            "is_a": "moon",
            "contained_in_file": "moon_file",
            "uniqueRef": "name",
            "refs": {
                "name": "moon44"
            },
            "brothers": {},
            "joined": {}
        }
    },
    "options": {
        "limit": 100,
        "load_data": true
    }
};
//# sourceMappingURL=JSONQuery.js.map