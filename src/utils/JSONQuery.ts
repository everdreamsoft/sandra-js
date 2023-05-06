import { Concept } from "../models/Concept";
import { SystemConcepts } from "../models/SystemConcepts";
import { Triplet } from "../models/Triplet";
import { Entity } from "../wrappers/Entity";
import { EntityFactory } from "../wrappers/EntityFactory";
import { Common } from "./Common";
import { TemporaryId } from "./TemporaryId";


export class JSONQuery {

    private static readonly SELECT_TEMPLATE = {
        "is_a": "planet",
        "contained_in_file": "planet_file",
        "uniqueRef": "name",
        // List of references key value pair to search for.
        "refs": {
            "name": "planet1"
        },
        // Brother triplet list with verb as "hasMoon" and "yes" as the target string to search for. 
        // refs is the list of key value pair of reference attached to that brother triplet.
        "brothers": {
            "hasMoon": {
                "target": "yes",
                "refs": {}
            }
        },
        "joined": {
            // Key value pair of the joined verb and its target
            "moon": {
                // Target is the entity attached as target of the given verb, here 
                // moon enitity attached to "moon" verb on planet enitity to search for.
                "target": {
                    "is_a": "moon",
                    "contained_in_file": "moon_file",
                    "uniqueRef": "name",
                    "refs": {
                        "name": "moon1"
                    },
                    "brothers": {},
                    "joined": {},
                    "options": {
                        // If set true then this target entity refs, brother triplets and joined entity subject ids 
                        // are also loaded.
                        "load_data": true
                    }
                },
                // Key value pair of the references attached to the joined entity verb
                "refs": {
                    "hasAtmosphere": "yes"
                }
            }
        },
        // options to limit number of records to filter.
        // if load_data is set to true then it will load entities with its references, brother triplets and 
        // joined entites subject ids
        "options": {
            "limit": 10,
            "load_data": true
        }
    }

    private static readonly PUSH_TEMPLATE = {
        "is_a": "planet",
        "contained_in_file": "planet_file",
        "uniqueRef": "name",
        "refs": {
            "name": "planet1",
            "diameter": "10",
            "atmosphere": "yes",
        },
        "brothers": {
            // Triplet brother on verb "hasMoon" with value as "false"
            // Refs attached to this triplet as "totalMoon" with value as "1"
            "hasMoon": {
                "target": "false",
                "refs": {
                    "totalMoon": "1"
                }
            },
            "hasAtmosphere": {
                "target": "true",
                "refs": {
                    "breathable": "no"
                }
            }
        },
        "joined": {
            "moon": {
                "target": {
                    "is_a": "moon",
                    "contained_in_file": "moon_file",
                    "uniqueRef": "name",
                    "refs": {
                        "name": "moon1"
                    },
                    "brothers": {
                    },
                    "joined": {
                    },
                    // If push is set to true or removed, it will also push the joined entity if it does not exist
                    "push": true
                },
                // Ref attached to the joined triplet with verb "moon"
                "refs": {
                    "atmosphere": "no"
                }
            },
            // Another joined triplet/entity on the planet1 with verb "lifeForms"
            "lifeForms": {
                "target": {
                    "is_a": "humans",
                    "contained_in_file": "humans_file",
                    "uniqueRef": "name",
                    "refs": {
                        "name": "level1"
                    },
                    "brothers": {
                    },
                    "joined": {
                    },
                    // This entity will not be pushed it does not exist. In case you are not sure then this 
                    // should be removed or set to true to push this also.
                    "push": false
                },
                "refs": {},
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
    static async select(query: any, server: string): Promise<Entity[]> {
        return JSONQuery.filter(query, 0, server);
    }

    /***
    * Gets entities as json on bases of given json
    * @param query JSON query  
    * @returns Promise<any> 
    */
    static async selectAsJson(query: any, server: string): Promise<any> {
        let res = await JSONQuery.filter(query, 0, server);
        let jsonRes: any = [];
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
    static async push(data: any, server: string) {
        await JSONQuery.pushJson(data, 0, server);
    }

    private static async filter(json: any, level: number = 0, server: string): Promise<Entity[]> {

        let limit = 1;
        if (level == 0) limit = json.options.limit;

        let is_a = json["is_a"];
        let cif = json["contained_in_file"];
        let uniqueRef = json["uniqueRef"];

        let uniqueRefConcept = await SystemConcepts.get(uniqueRef, server);
        let factory = new EntityFactory(is_a, cif, uniqueRefConcept);

        let subConcept = new Concept(TemporaryId.create(), Concept.ENTITY_CONCEPT_CODE_PREFIX + factory.getIsAVerb(), undefined);
        let sysCiFConcept = await SystemConcepts.get("contained_in_file", server);
        let sysisAConcept = await SystemConcepts.get("is_a", server);

        let cifConcept = await SystemConcepts.get(cif, server);
        let isAConcept = await SystemConcepts.get(is_a, server);

        let cifTriplet = new Triplet(TemporaryId.create(), subConcept, sysCiFConcept, cifConcept);
        let isATriplet = new Triplet(TemporaryId.create(), subConcept, sysisAConcept, isAConcept);

        let refsArr = [];
        if (json.refs) {
            let refKeys = Object.keys(json.refs);
            for (let i = 0; i < refKeys.length; i++) {
                let ref = await Common.createDBReference(refKeys[i], json.refs[refKeys[i]], cifTriplet, server);
                refsArr.push(ref);
            }
        }

        let tripletsArr = [cifTriplet, isATriplet];
        if (json.brothers) {
            let tripletsKeys = Object.keys(json.brothers);
            for (let i = 0; i < tripletsKeys.length; i++) {
                let brotherVerb = tripletsKeys[i];
                let brotherTargetValues = json.brothers[tripletsKeys[i]];

                if (brotherTargetValues.target) {

                    let brotherTarget = brotherTargetValues.target;
                    let brotherTriplet = new Triplet(TemporaryId.create(), subConcept, await SystemConcepts.get(brotherVerb, server), await SystemConcepts.get(brotherTarget, server));
                    tripletsArr.push(brotherTriplet);

                    if (brotherTargetValues.refs) {
                        // References attached with this brother triplet 
                        let refKeys = Object.keys(brotherTargetValues.refs);
                        for (let i = 0; i < refKeys.length; i++) {
                            let ref = await Common.createDBReference(refKeys[i], brotherTargetValues.refs[refKeys[i]], brotherTriplet, server);
                            refsArr.push(ref);
                        }
                    }

                }
            }
        }

        if (json.joined) {
            let joinedKeys = Object.keys(json.joined);
            for (let i = 0; i < joinedKeys?.length; i++) {

                let verbConcept = await SystemConcepts.get(joinedKeys[i], server);
                let joinedTargetValues = json.joined[joinedKeys[i]];

                if (joinedTargetValues.target) {

                    let joinedTarget = joinedTargetValues.target;
                    let targets = await this.filter(joinedTarget, level + 1, server);
                    if (targets?.length > 0) {
                        let triplet = new Triplet(TemporaryId.create(), subConcept, verbConcept, targets[0].getSubject());
                        triplet.setJoinedEntity(targets[0]);
                        if (joinedTargetValues.refs) {
                            // References attached with this brother triplet 
                            let refKeys = Object.keys(joinedTargetValues.refs);
                            for (let i = 0; i < refKeys.length; i++) {
                                let ref = await Common.createDBReference(refKeys[i], joinedTargetValues.refs[refKeys[i]], triplet, server);
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
            await factory.loadTriplets(undefined, undefined, true);
            await factory.loadAllTripletRefs();
        }

        return Promise.resolve(factory.getEntities());

    }

    private static async pushJson(json: any, level: number = 0, server: string): Promise<EntityFactory | undefined> {

        let is_a = json["is_a"];
        let cif = json["contained_in_file"];
        let uniqueRef = json["uniqueRef"];

        let uniqueRefConcept = await SystemConcepts.get(uniqueRef, server);
        let factory = new EntityFactory(is_a, cif, uniqueRefConcept);

        let refsArr = [];
        if (json.refs) {
            let refKeys = Object.keys(json.refs);
            for (let i = 0; i < refKeys.length; i++) {
                let ref = await Common.createDBReference(refKeys[i], json.refs[refKeys[i]], undefined, server);
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
                            let ref = await Common.createDBReference(refKeys[i], brotherTargetValues.refs[refKeys[i]], undefined, server);
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
                let verbConcept = await SystemConcepts.get(joinedKeys[i], server);
                let joinedTargetValues = json.joined[joinedKeys[i]];

                if (joinedTargetValues.target) {
                    let joinedTarget = joinedTargetValues.target;
                    let joinedRefs = [];
                    let targets = (await this.pushJson(joinedTarget, level + 1, server))?.getEntities();

                    if (targets && targets?.length > 0) {
                        if (joinedTargetValues.refs) {
                            // References attached with this joined triplet 
                            let refKeys = Object.keys(joinedTargetValues.refs);
                            for (let i = 0; i < refKeys.length; i++) {
                                let ref = await Common.createDBReference(refKeys[i], joinedTargetValues.refs[refKeys[i]], undefined, server);
                                joinedRefs.push(ref);
                            }
                        }
                        await entity.addTriplet(verbConcept, targets[0].getSubject(), joinedRefs, true, true);
                    }
                    else {
                        return undefined;
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