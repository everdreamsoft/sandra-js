import { Concept } from "./Concept";
import { Entity } from "./Entity";
import { EntityFactory } from "./EntityFactory";
import { SystemConcepts } from "./SystemConcepts";
import { TemporaryId } from "./TemporaryId";
import { Triplet } from "./Triplet";
import { Utils } from "./Utils";

export class JSONQuery {

    private static readonly TEMPLATE = {
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
                "brothers": {
                },
                "joined": {
                }
            }
        },
        "options": {
            "limit": 100,
            "load_data": true
        }
    };

    constructor() {
    }

    // Example template for a query as json 
    static async getTemplate() {
        return JSONQuery.TEMPLATE;
    }

    static async select(query: any): Promise<Entity[]> {
        return JSONQuery.QueryJSON(query);
    }

    static async selectAsJson(query: any): Promise<any> {

        let res = await JSONQuery.QueryJSON(query);
        let jsonRes = [];

        res.forEach(e => {
            jsonRes.push(e.asJSON());
        })

        return Promise.resolve(jsonRes);
    }


    static async push(data: any) {
        throw new Error("Function not implemented");
    }

    private static async QueryJSON(json: any, level: number = 0): Promise<Entity[]> {

        let limit = 1;
        if (level == 0) limit = json.options.limit;

        let uniqueRefConcept = await SystemConcepts.get(json["uniqueRef"]);
        let factory = new EntityFactory(json["is_a"], json["contained_in_file"], uniqueRefConcept);

        let subConcept = new Concept(TemporaryId.create(), Concept.ENTITY_CONCEPT_CODE_PREFIX + factory.getIsAVerb(), null);

        let cFile = await SystemConcepts.get(json["contained_in_file"]);
        let sysCiF = await SystemConcepts.get("contained_in_file");
        let t2 = new Triplet(TemporaryId.create(), subConcept, sysCiF, cFile);

        let refsArr = [];
        let refKeys = Object.keys(json.refs);
        for (let i = 0; i < refKeys.length; i++) {
            let ref = await Utils.createDBReference(refKeys[i], json.refs[refKeys[i]], t2);
            refsArr.push(ref);
        }

        let tripletsArr = [t2];
        let tripletsKeys = Object.keys(json.brothers);
        for (let i = 0; i < tripletsKeys.length; i++) {
            tripletsArr.push(new Triplet(
                TemporaryId.create(),
                subConcept,
                await SystemConcepts.get(tripletsKeys[i]),
                await SystemConcepts.get(json.brothers[tripletsKeys[i]])
            ));
        }

        let joinedKeys = Object.keys(json.joined);
        for (let i = 0; i < joinedKeys?.length; i++) {
            let verbConcept = await SystemConcepts.get(joinedKeys[i]);
            let targets = await this.QueryJSON(json.joined[joinedKeys[i]], level + 1);

            if (targets?.length > 0) {
                let triplet = new Triplet(TemporaryId.create(), subConcept, verbConcept, targets[0].getSubject());
                triplet.setJoinedEntity(targets[0]);
                tripletsArr.push(triplet);
            }
            else {
                return [];
            }
        }

        await factory.filter(tripletsArr, refsArr, limit);

        console.log(level + " count - " + factory.getEntities()?.length);

        if (json.options.load_data) {
            await factory.loadTriplets(true);
            await factory.loadAllTripletRefs();
        }

        return Promise.resolve(factory.getEntities());

    }

}