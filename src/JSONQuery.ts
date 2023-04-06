import { Concept } from "./Concept";
import { Entity } from "./Entity";
import { EntityFactory } from "./EntityFactory";
import { SystemConcepts } from "./SystemConcepts";
import { TemporaryId } from "./TemporaryId";
import { Triplet } from "./Triplet";
import { Utils } from "./Utils";

export class JSONQuery {

    private static readonly SELECT_TEMPLATE = {
        "is_a": "planet",
        "contained_in_file": "planet_file",
        "uniqueRef": "name",
        "refs": {
        },
        "brothers": {
            "hasMoon": {
                "target": "true",
                "refs": {
                    "totalMoon": "1"
                }
            }
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
                },
                "options": {
                    "load_data": true
                }
            }
        },
        "options": {
            "limit": 10,
            "load_data": true
        }
    };

    private static readonly PUSH_TEMPLATE = {
        "is_a": "planet",
        "contained_in_file": "planet_file",
        "uniqueRef": "name",
        "refs": {
            "name": "planetZZ",
            "diameter": "10",
            "atmosphere": "yes",
            "atmosphere1": "yes",
            "atmosphere2": "yes"
        },
        "brothers": {
            "hasMoon": {
                "target": "false",
                "refs": {
                    "totalMoon": "44"
                }
            },
            "hasAtmosphere": {
                "target": "true",
                "refs": {
                    "breathable": "yes"
                }
            }
        },
        "joined": {
            "moon": {
                "is_a": "moon",
                "contained_in_file": "moon_file",
                "uniqueRef": "name",
                "refs": {
                    "name": "moonZZ"
                },
                "brothers": {
                },
                "joined": {
                }
            },
            "satellite": {
                "is_a": "satellite",
                "contained_in_file": "satellite_file",
                "uniqueRef": "name",
                "refs": {
                    "name": "satelliteZZZ"
                },
                "brothers": {
                },
                "joined": {
                }
            },
            "lifeForms": {
                "is_a": "humans",
                "contained_in_file": "humans_file",
                "uniqueRef": "name",
                "refs": {
                    "name": "level1"
                },
                "brothers": {
                },
                "joined": {
                }
            }
        }
    };

    constructor() {
    }

    /**
     *  JSON template for selection query  
     * @returns JSON
     */
    static async getSelectTemplate() {
        return JSONQuery.SELECT_TEMPLATE;
    }

    /**
     *  JSON template for push query  
     * @returns JSON
     */
    static async getPushTemplate() {
        return JSONQuery.PUSH_TEMPLATE;
    }

    /***
     * Gets entities array object on bases of given json
     * @param query JSON query  
     * @returns Promise<Entity[]> 
     */
    static async select(query: any): Promise<Entity[]> {
        return JSONQuery.filter(query);
    }

    /***
    * Gets entities as json on bases of given json
    * @param query JSON query  
    * @returns Promise<any> 
    */
    static async selectAsJson(query: any): Promise<any> {
        let res = await JSONQuery.filter(query);
        let jsonRes = [];
        res.forEach(e => {
            jsonRes.push(e.asJSON());
        })
        return Promise.resolve(jsonRes);
    }

    /***
    * Pushes entity data 
    * @param data entity data as json   
    * @returns Promise<void> 
    */
    static async push(data: any) {
        await JSONQuery.pushJson(data);
    }

    private static async filter(json: any, level: number = 0): Promise<Entity[]> {

        let limit = 1;
        if (level == 0) limit = json.options.limit;

        let is_a = json["is_a"];
        let cif = json["contained_in_file"];
        let uniqueRef = json["uniqueRef"];

        let uniqueRefConcept = await SystemConcepts.get(uniqueRef);
        let factory = new EntityFactory(is_a, cif, uniqueRefConcept);

        let subConcept = new Concept(TemporaryId.create(), Concept.ENTITY_CONCEPT_CODE_PREFIX + factory.getIsAVerb(), null);
        let sysCiFConcept = await SystemConcepts.get("contained_in_file");
        let cifConcept = await SystemConcepts.get(cif);

        let cifTriplet = new Triplet(TemporaryId.create(), subConcept, sysCiFConcept, cifConcept);

        let refsArr = [];
        if (json.refs) {
            let refKeys = Object.keys(json.refs);
            for (let i = 0; i < refKeys.length; i++) {
                let ref = await Utils.createDBReference(refKeys[i], json.refs[refKeys[i]], cifTriplet);
                refsArr.push(ref);
            }
        }

        let tripletsArr = [cifTriplet];
        if (json.brothers) {
            let tripletsKeys = Object.keys(json.brothers);
            for (let i = 0; i < tripletsKeys.length; i++) {
                let brotherVerb = tripletsKeys[i];
                let brotherTargetValues = json.brothers[tripletsKeys[i]];

                if (brotherTargetValues.target) {

                    let brotherTarget = brotherTargetValues.target;
                    let brotherTriplet = new Triplet(TemporaryId.create(), subConcept, await SystemConcepts.get(brotherVerb), await SystemConcepts.get(brotherTarget));
                    tripletsArr.push(brotherTriplet);

                    if (brotherTargetValues.refs) {
                        // References attached with this brother triplet 
                        let refKeys = Object.keys(brotherTargetValues.refs);
                        for (let i = 0; i < refKeys.length; i++) {
                            let ref = await Utils.createDBReference(refKeys[i], brotherTargetValues.refs[refKeys[i]], brotherTriplet);
                            refsArr.push(ref);
                        }
                    }

                }
            }
        }

        if (json.joined) {
            let joinedKeys = Object.keys(json.joined);
            for (let i = 0; i < joinedKeys?.length; i++) {

                let verbConcept = await SystemConcepts.get(joinedKeys[i]);
                let joinedTargetValues = json.joined[joinedKeys[i]];

                if (joinedTargetValues.target) {

                    let joinedTarget = joinedTargetValues.target;
                    let targets = await this.filter(joinedTarget, level + 1);
                    if (targets?.length > 0) {
                        let triplet = new Triplet(TemporaryId.create(), subConcept, verbConcept, targets[0].getSubject());
                        triplet.setJoinedEntity(targets[0]);
                        if (joinedTargetValues.refs) {
                            // References attached with this brother triplet 
                            let refKeys = Object.keys(joinedTargetValues.refs);
                            for (let i = 0; i < refKeys.length; i++) {
                                let ref = await Utils.createDBReference(refKeys[i], joinedTargetValues.refs[refKeys[i]], triplet);
                                refsArr.push(ref);
                            }
                        }
                        tripletsArr.push(triplet);
                    }
                    else {
                        return [];
                    }

                }

            }
        }

        await factory.filter(tripletsArr, refsArr, limit);

        if (json.options?.load_data) {
            await factory.loadTriplets(true);
            await factory.loadAllTripletRefs();
        }

        return Promise.resolve(factory.getEntities());

    }

    private static async pushJson(json: any, level: number = 0): Promise<EntityFactory> {

        let is_a = json["is_a"];
        let cif = json["contained_in_file"];
        let uniqueRef = json["uniqueRef"];

        let uniqueRefConcept = await SystemConcepts.get(uniqueRef);
        let factory = new EntityFactory(is_a, cif, uniqueRefConcept);

        let refsArr = [];
        if (json.refs) {
            let refKeys = Object.keys(json.refs);
            for (let i = 0; i < refKeys.length; i++) {
                let ref = await Utils.createDBReference(refKeys[i], json.refs[refKeys[i]]);
                refsArr.push(ref);
            }
        }

        // Creating factory object 
        let entity = await factory.create(refsArr, true);

        if (json.brothers) {
            let tripletsKeys = Object.keys(json.brothers);
            for (let i = 0; i < tripletsKeys.length; i++) {
                let brotherVerb = tripletsKeys[i];
                let brotherTargetValues = json.brothers[tripletsKeys[i]];

                if (brotherTargetValues.target) {
                    let brotherTarget = brotherTargetValues.target;
                    let brotherRefs = [];
                    if (brotherTargetValues.refs) {
                        // References attached with this brother triplet 
                        let refKeys = Object.keys(brotherTargetValues.refs);
                        for (let i = 0; i < refKeys.length; i++) {
                            let ref = await Utils.createDBReference(refKeys[i], brotherTargetValues.refs[refKeys[i]]);
                            brotherRefs.push(ref);
                        }
                    }
                    await entity.brother(brotherVerb, brotherTarget, brotherRefs, true);
                }
            }
        }

        if (json.joined) {
            let joinedKeys = Object.keys(json.joined);
            for (let i = 0; i < joinedKeys?.length; i++) {
                let verbConcept = await SystemConcepts.get(joinedKeys[i]);
                let joinedTargetValues = json.joined[joinedKeys[i]];

                if (joinedTargetValues.target) {
                    let joinedTarget = joinedTargetValues.target;
                    let joinedRefs = [];
                    let targets = (await this.pushJson(joinedTarget, level + 1)).getEntities();

                    if (targets?.length > 0) {
                        if (joinedTargetValues.refs) {
                            // References attached with this joined triplet 
                            let refKeys = Object.keys(joinedTargetValues.refs);
                            for (let i = 0; i < refKeys.length; i++) {
                                let ref = await Utils.createDBReference(refKeys[i], joinedTargetValues.refs[refKeys[i]]);
                                joinedRefs.push(ref);
                            }
                        }
                        await entity.addTriplet(verbConcept, targets[0].getSubject(), joinedRefs, true, true);
                    }
                    else {
                        return null;
                    }
                }

            }
        }

        await factory.loadAllSubjects();

        if (!("push" in json) || json.push) {
            entity.setPushedStatus(false);
            await factory.push();
        }


        return Promise.resolve(factory);

    }

}