import { IAbortOption } from "../interfaces/IAbortOption";
import { IDBConfig } from "../interfaces/IDBconfig";
import { LogManager } from "../loggers/LogManager";
import { Concept } from "../models/Concept";
import { Reference } from "../models/Reference";
import { Triplet } from "../models/Triplet";
import { TemporaryId } from "../utils/TemporaryId";
import { Entity } from "../wrappers/Entity";
import { DBBaseAdapter } from "./DBBaseAdapter";

export class SandraAdapter extends DBBaseAdapter {

    private readonly TABLE_CONCEPTS = "concepts";
    private readonly TABLE_REFERENCES = "references";
    private readonly TABLE_TRIPLETS = "triplets";
    private readonly TABLE_STORAGE = "datastorage";

    private tables: Map<string, string> = new Map<string, string>();

    constructor(config: IDBConfig) {
        super(config);

        if (config.tables) {

            if (!config.tables.concepts || !config.tables.references || !config.tables.triplets || !config.tables.datastorage) {
                throw new Error("Invalid table names, please check config for sandra db tables");
            }

            this.tables.set(this.TABLE_CONCEPTS, config.tables.concepts);
            this.tables.set(this.TABLE_REFERENCES, config.tables.references);
            this.tables.set(this.TABLE_TRIPLETS, config.tables.triplets);
            this.tables.set(this.TABLE_STORAGE, config.tables.datastorage);
        }
        else {
            this.tables.set(this.TABLE_CONCEPTS, config.env + "_SandraConcept");
            this.tables.set(this.TABLE_REFERENCES, config.env + "_SandraReferences");
            this.tables.set(this.TABLE_TRIPLETS, config.env + "_SandraTriplets");
            this.tables.set(this.TABLE_STORAGE, config.env + "_SandraDatastorage");
        }
    }

    /**
     * Begins DB transaction. 
     */
    async beginTransaction() {
        LogManager.getInstance().info("starting transaction..")
        await this.getConnectionPool().query("start transaction;");
    }

    /**
     * Commits DB transactions.
     */
    async commit() {
        LogManager.getInstance().info("committing tranaction..")
        await this.getConnectionPool().query("commit;");
    }

    /**
     * Runs DB query to sleep for given durations. 
     * @param durationInSec 
     */
    async sleep(durationInSec: number) {
        LogManager.getInstance().info("Sleep for " + durationInSec + "s");
        await this.getConnectionPool().query("select sleep(" + durationInSec + ")");
    }

    /**
     * Queries database concepts table for given shortname
     * @param shortname 
     * @returns Returns promise of concept with given shortname
     */
    async getConcept(shortname: string, options?: IAbortOption): Promise<Concept | undefined> {

        let sql = "select * from " + this.tables.get(this.TABLE_CONCEPTS) + " where shortname = ?";
        const [rows, fields] = await this.getConnectionPool().query(sql, shortname, options);

        return new Promise((resolve, reject) => {
            if (Array.isArray(rows) && rows.length > 0) {
                let row: any = rows[0];
                return resolve(new Concept(row.id, row.code, row.shortname));
            }
            return resolve(undefined)
        });

    }

    /**
     * Adds given concept, if found then igores it.
     * @param c 
     * @param withId 
     * @returns Returns added concept else null 
     */
    async addConcept(c: Concept, withId: boolean = false, options?: IAbortOption): Promise<Concept | undefined> {

        let sql = "insert ignore into " + this.tables.get(this.TABLE_CONCEPTS) + " set code = ?, shortname = ?";

        if (withId)
            sql = "insert ignore into " + this.tables.get(this.TABLE_CONCEPTS) + " set id = ?, code = ?, shortname = ?";

        const [result] = await this.getConnectionPool().query(sql, c.getDBArrayFormat(withId), options);

        if (result && (result as any).insertId) {
            c.setId((result as any).insertId);
        }

        // If shortname is not null, otherwise it will always insert a new id 
        if (c.getShortname()) {

            sql = "select * from " + this.tables.get(this.TABLE_CONCEPTS) + " where shortname = ?";
            const [rows, fields] = await this.getConnectionPool().query(sql, c.getShortname(), options);

            if (Array.isArray(rows) && rows.length > 0) {
                let row: any = rows[0];
                c.setId(row.id);
                c.setCode(row.code);
            }
        }

        return Promise.resolve(c);

    }

    /**
     * Queries database for references attached to given triplet and if reference concept is provided 
     * then only those reference concepts are selected
     * @param t 
     * @param refConcept 
     * @returns Returns Reference class object of given triplet.
     */
    async getReferenceByTriplet(triplet: Triplet, refConcept?: Concept, options?: IAbortOption): Promise<Reference[]> {

        let refCon = "";
        let v = [triplet.getId()];

        if (refConcept) {
            refCon = " and r.idConcept in (?)"
            v = [...v, refConcept.getId()];
        }

        let sql = "select r.id, c.id as cId, c.code, c.shortname, r.value from "
            + this.tables.get(this.TABLE_REFERENCES) + " as r " + " join "
            + this.tables.get(this.TABLE_CONCEPTS) + " as c on r.idConcept = c.id and r.linkReferenced = ?" + refCon;

        let [rows]: any = await this.getConnectionPool().query(sql, v, options);

        return new Promise((resolve, reject) => {
            let refs: Reference[] = [];
            if (rows?.length > 0) {
                if (options?.abort)
                    return reject(new Error("Operation aborted"));
                rows.forEach((row: any) => {
                    refs.push(
                        new Reference(row.id,
                            new Concept(row.cId, row.code, row.shortname),
                            triplet,
                            row.value
                        )
                    );
                });
            }
            return resolve(refs);
        })

    }

    /**
     * Query database for references attached to given triplets array
     * @param triplets 
     * @returns Returns a promis of References array for given triplets
     */
    async getReferenceByTriplets(triplets: Triplet[], refsConcepts?: Concept[], options?: IAbortOption): Promise<Reference[]> {

        let refsConceptIds: string[] = [];

        if (refsConcepts) {
            refsConceptIds = refsConcepts.map(r => r.getId())
        }

        let sql = "select r.id,  r.linkReferenced as tripletId, c.id as cId, c.code, c.shortname, r.value from " +
            this.tables.get(this.TABLE_REFERENCES) + " as r join " +
            this.tables.get(this.TABLE_CONCEPTS) + " as c " +
            " on r.idConcept = c.id and r.linkReferenced in (?)";

        let values: any = [];

        values.push(triplets.map(t => t.getId()));

        if (refsConceptIds.length > 0) {
            sql = sql + " and r.idConcept in (?) ";
            values.push(refsConceptIds.toString());
        }

        let [rows]: any = await this.getConnectionPool().query(sql, values, options);

        return new Promise((resolve, reject) => {
            let refs: Reference[] = [];
            if (rows?.length > 0) {
                rows.forEach((row: any) => {
                    if (options?.abort)
                        return reject(new Error("Operation aborted"));
                    refs.push(
                        new Reference(row.id,
                            new Concept(row.cId, row.code, row.shortname),
                            new Triplet(row.tripletId, undefined, undefined, undefined),
                            row.value
                        )
                    );
                });
            }
            return resolve(refs);
        });

    }

    /**
     *  Get the triplet attached with given verb and target linked to given reference
     */
    async getEntityTriplet(verb: Concept, target: Concept, ref: Reference | undefined, limit: number = 9999999, options?: IAbortOption): Promise<Triplet[]> {

        let sql = "", rows: any;

        if (ref) {
            sql = "select t.id, c.id as subjectId, c.code as subjectCode, c.shortname as subjectShortname, t.idConceptLink as verb, t.idConceptTarget as target from " +
                this.tables.get(this.TABLE_TRIPLETS) + " as t join  " +
                this.tables.get(this.TABLE_REFERENCES) + " as r " +
                " on t.id = r.linkReferenced and t.idConceptLink = ? and t.idConceptTarget = ? and r.value = ? and r.idConcept = ? join " +
                this.tables.get(this.TABLE_CONCEPTS) + " as c on t.idConceptStart = c.id limit ?";

            [rows] = await this.getConnectionPool().query(sql, [verb.getId(), target.getId(), ref.getValue(), ref.getIdConcept()?.getId(), limit], options);
        }
        else {
            sql = "select t.id, c.id as subjectId, c.code as subjectCode, c.shortname as subjectShortname, t.idConceptLink as verb, t.idConceptTarget as target from " +
                this.tables.get(this.TABLE_TRIPLETS) + " as t join " +
                this.tables.get(this.TABLE_CONCEPTS) + " as c on  t.idConceptStart = c.id and  t.idConceptLink = ? and t.idConceptTarget = ? limit ? ";

            [rows] = await this.getConnectionPool().query(sql, [verb.getId(), target.getId(), limit]);
        }

        return new Promise((resolve, reject) => {

            let triplets: Triplet[] = [];

            if (rows?.length > 0) {
                rows.forEach((row: any) => {
                    if (options?.abort)
                        return reject(new Error("Operation aborted"));
                    triplets.push(
                        new Triplet(
                            row.id,
                            new Concept(row.subjectId, row.subjectCode, row.subjectShortname),
                            verb,
                            target
                        )
                    );
                });
            }

            return resolve(triplets);

        });

    }

    /**
     * Loading triplets with given subject, verb and targets 
     * @param subjects 
     * @param verbs 
     * @param targets 
     * @param loadConcepts 
     * @param options 
     * @returns 
     */
    async getTriplets(subjects: Concept[], verbs: Concept[] | undefined = undefined, targets: Concept[] | undefined, loadConcepts: boolean = false, options?: IAbortOption): Promise<Triplet[]> {

        let subConcept = subjects.map(s => s.getId());
        let verbConcept = verbs?.map(v => v.getId());
        let targetConcept = targets?.map(t => t.getId());
        let vals = [];

        let sql = "";

        // Use joins 
        sql = "select t1.id as id, t1.idConceptStart as subId ,#SELECT# from  "
            + this.tables.get(this.TABLE_TRIPLETS) + " as t1  "

        if (loadConcepts) {
            sql = sql + " join  " + this.tables.get(this.TABLE_CONCEPTS) + " as c1 on t1.idConceptLink = c1.id ";
            sql = sql + " join  " + this.tables.get(this.TABLE_CONCEPTS) + " as c2 on t1.idConceptTarget = c2.id ";
            sql = sql.replace(",#SELECT#", ", c1.id as vId, c1.code as vCode, c1.shortname as vSn ,#SELECT#");
            sql = sql.replace(",#SELECT#", ", c2.id as tId, c2.code as tCode, c2.shortname as tSn ,#SELECT#");
            sql = sql + " and t1.idConceptStart in (?) "
            vals.push(subConcept);
        }
        else {
            sql = sql.replace(",#SELECT#", ", null as vId, null as vCode, null as vSn ,#SELECT#");
            sql = sql.replace(",#SELECT#", ", null as tId, null as tCode, null as tSn ,#SELECT#");
            sql = sql + " where t1.idConceptStart in (?) "
            vals.push(subConcept);
        }

        if (verbs) {
            sql = sql + " and t1.idConceptLink in (?) "
            vals.push(verbConcept);
        }

        if (targets) {
            sql = sql + " and t1.idConceptTarget in (?) ";
            vals.push(targetConcept);
        }

        sql = sql.replace(",#SELECT#", "");

        let [rows]: any = await this.getConnectionPool().query(sql, vals, options);

        return new Promise((resolve, reject) => {
            let triplets: Triplet[] = [];
            if (rows?.length > 0) {
                rows.forEach((row: any) => {
                    if (options?.abort)
                        return reject(new Error("Operation aborted"));
                    triplets.push(
                        new Triplet(
                            row.id,
                            new Concept(row.subId, "", undefined),
                            new Concept(row.vId, row.vCode, row.vSn),
                            new Concept(row.tId, row.tCode, row.tSn)
                        )
                    );
                });
            }
            return resolve(triplets);
        });

    }

    async getEntityConceptsByRefs(cifTriplet: Triplet, isATriplet: Triplet | undefined, refsValuesToSearch: string[], refConcept: Concept, options?: IAbortOption): Promise<Map<string, Concept>> {

        let sql = "";
        let vals: any[] = [];

        if (isATriplet) {
            sql = "select  c.id, c.code, c.shortname, r.value from " + this.tables.get(this.TABLE_TRIPLETS) + " as t1" +
                " join " + this.tables.get(this.TABLE_TRIPLETS) + " as t2 on t1.idConceptStart = t2.idConceptStart " +
                " and t1.idConceptLink = ? and t2.idConceptLink = ? " +
                " and t1.idConceptTarget = ? and t2.idConceptTarget = ? " +
                " join " + this.tables.get(this.TABLE_CONCEPTS) + " as c on t2.idConceptStart = c.id" +
                " join " + this.tables.get(this.TABLE_REFERENCES) + " as r on t2.id = r.linkReferenced and r.idConcept = ? and r.value in (?) ";

            vals = [
                isATriplet.getVerb()?.getId(),
                cifTriplet.getVerb()?.getId(),
                isATriplet.getTarget()?.getId(),
                cifTriplet.getTarget()?.getId(),
                refConcept.getId(),
                refsValuesToSearch
            ];

        }
        else {
            sql = "select  c.id, c.code, c.shortname, r.value from " + this.tables.get(this.TABLE_TRIPLETS) + " as t1" +
                " join " + this.tables.get(this.TABLE_CONCEPTS) + " as c on t1.idConceptStart = c.id" +
                " and t1.idConceptLink = ? " +
                " and t1.idConceptTarget = ? " +
                " join " + this.tables.get(this.TABLE_REFERENCES) + " as r on t1.id = r.linkReferenced and r.idConcept = ? and r.value in (?) ";

            vals = [
                cifTriplet.getVerb()?.getId(),
                cifTriplet.getTarget()?.getId(),
                refConcept.getId(),
                refsValuesToSearch
            ];
        }

        let [rows]: any = await this.getConnectionPool().query(sql, vals, options);

        return new Promise((resolve, reject) => {

            if (options?.abort)
                return reject(new Error("Operation aborted"));

            let map: Map<string, Concept> = new Map();

            if (rows?.length > 0) {
                rows.forEach((row: any) => {

                    if (options?.abort)
                        return reject(new Error("Operation aborted"));

                    map.set(row.value.toString(), new Concept(row.id, row.code, row.shortname));

                });
            }
            return resolve(map);
        });

    }

    /**
   * Queries the database for concpets with given is_a and shortname null, entity concepts
   * @param is_a - checks for code in concepts table
   * @param lastId - Get data with id less than lastId
   * @param limit - Limit records 
   * @returns Concepts array
   */
    async getEntityConcepts(cifFileVerb: Concept, cifFileTargetSub: Concept, lastId?: string, limit?: string, options?: IAbortOption): Promise<Concept[]> {

        let limitQ = "";
        let lastIdQ = "";

        if (lastId)
            lastIdQ = " and c.id < " + lastId + " order by c.id desc";
        else {
            lastIdQ = " order by c.id desc";
        }

        if (limit)
            limitQ = " limit " + limit;

        let sql = "select c.id, c.code, c.shortname from " + this.tables.get(this.TABLE_TRIPLETS) +
            " as t join " + this.tables.get(this.TABLE_CONCEPTS) + " as c on t.idConceptStart = c.id " +
            " and t.idConceptLink = ?  and t.idConceptTarget =  ? " + lastIdQ + limitQ;

        const [rows]: any = await this.getConnectionPool().query(sql, [cifFileVerb.getId(), cifFileTargetSub.getId()], options);

        return new Promise((resolve, reject) => {

            if (options?.abort)
                return reject(new Error("Operation aborted"));

            let concpets: Concept[] = [];

            if (rows?.length > 0) {
                rows.forEach((row: any) => {

                    if (options?.abort)
                        return reject(new Error("Operation aborted"));

                    concpets.push(
                        new Concept(row.id, row.code, row.shortname)
                    );

                });
            }

            return resolve(concpets);

        });



    }

    /**
     * Updates given entities references from the database
     * @param entities 
     * @param containedInFileConcept 
     * @returns 
     */
    async getEntityConceptsRefs(entities: Entity[], containedInFileConcept: Concept, options?: IAbortOption): Promise<void> {

        if (entities?.length == 0) return;

        let subjs = [];

        subjs = entities.map(e => {
            let sub = e.getSubject();
            if (sub)
                return sub.getId();
            else
                throw new Error("Entity subject undefined");
        });

        let sql = "select t.id as tId, t.idConceptStart as subjectId , c.id, c.code," +
            " c.shortname, r.id as refId, r.idConcept as refCon, r.linkReferenced as refLink, " +
            " r.value as refVal from  " +
            this.tables.get(this.TABLE_REFERENCES) + "  as r " +
            " join " + this.tables.get(this.TABLE_TRIPLETS) + " as t on t.id = r.linkReferenced" +
            " join " + this.tables.get(this.TABLE_CONCEPTS) + " as c on r.idConcept = c.id" +
            " and t.idConceptStart in ? " +
            " and t.idConceptLink =  ? ";

        let [rows]: any = await this.getConnectionPool().query(sql, [[subjs], containedInFileConcept.getId()], options);

        return new Promise((resolve, reject) => {

            if (options?.abort)
                return reject(new Error("Operation aborted"));

            entities.forEach(e => {

                if (options?.abort)
                    return reject(new Error("Operation aborted"));

                let refsRows = rows.filter((r: any) => {
                    if (options?.abort)
                        return reject(new Error("Operation aborted"));

                    return r.subjectId == e.getSubject()?.getId()
                });

                if (refsRows?.length > 0) {

                    let t = new Triplet(refsRows[0].tId, e.getSubject(), containedInFileConcept, undefined);

                    let refs = refsRows.map((row: any) => {
                        let refConcept = new Concept(row.id, row.code, row.shortname);
                        return new Reference(row.refId, refConcept, t, row.refVal);
                    });

                    e.setRefs(refs);
                    e.getTriplets().push(t);

                }

            });

            resolve();

        });

    }

    /**
      * Filter by triplets and refernce, if a refrence is added then reference should have 
      * tripletLink set and this triplet should be provided with triplets parameter.
      * @param triplets 
      * @param refs 
      * @param limit 
      * @returns 
      */
    async filter(triplets: Triplet[], refs: Reference[], limit: number = 1000, options?: IAbortOption): Promise<Map<Concept, Triplet[]>> {

        let sql = "";
        let subject: Concept | undefined;
        let data: Map<Concept, Triplet[]> = new Map();

        // Add triplet filter
        if (triplets?.length > 0) {
            subject = triplets[0].getSubject();
            sql = "select t0.id as t0id, t0.idConceptStart t0idConceptStart ,#SELECT# from " + this.tables.get(this.TABLE_TRIPLETS) + " as t0 ";

            for (let index = 1; index < triplets.length; index++) {
                let t = triplets[index];
                sql = sql.replace("#SELECT#", "t" + index + ".id as t" + index + "id ,#SELECT#");
                sql = sql + " join " + this.tables.get(this.TABLE_TRIPLETS) + " as t" + index + " on t0.idConceptStart = " + "t" + index + ".idConceptStart";
                sql = sql + " and t" + index + ".idConceptTarget = " + t.getTarget()?.getId();
                sql = sql + " and t" + index + ".idConceptLink = " + t.getVerb()?.getId();
            }

        }
        else {
            // need atleast one triplet even if a reference is provided, 
            return Promise.resolve(data);
        }

        if (refs?.length > 0) {
            refs.forEach((r, index) => {
                // Get the triplet linked to this reference to get the table alias from previous query
                let t = r.getTripletLink();
                let i = triplets.findIndex(tp => { return t?.getId() == tp.getId() });

                if (i >= 0 && t) {
                    sql = sql.replace("#SELECT#", "r" + index + ".id as r" + index + "id ,#SELECT#");
                    sql = sql + " join " + this.tables.get(this.TABLE_REFERENCES) + " as r" + index + " on t" + i + ".id = r" + index + ".linkReferenced";
                    sql = sql + " and r" + index + ".idConcept = " + r.getIdConcept()?.getId();
                    if (r.getValue()?.length > 0)
                        sql = sql + " and r" + index + ".value = '" + r.getValue() + "' ";
                }

            });
        }

        sql = sql +
            (triplets?.length == 1 && refs?.length == 0 ? " where " : " and ") +
            " t0.idConceptTarget = " + triplets[0].getTarget()?.getId() + " and " +
            " t0.idConceptLink = " + triplets[0].getVerb()?.getId();

        sql = sql.replace(",#SELECT#", " ") + " order by t0.id desc limit " + limit;

        console.log(sql);
        
        let [rows]: any = await this.getConnectionPool().query(sql, undefined, options);

        return new Promise((resolve, reject) => {

            if (options?.abortSignal) {
                options.abortSignal.addListener("abort", () => {
                    return reject();
                })
            }

            if (options?.abort)
                return reject(new Error("Operation aborted"));

            if (rows?.length > 0) {
                rows.forEach((row: any) => {
                    let ts: Triplet[] = [];
                    let subConcept = new Concept(row.t0idConceptStart, (subject ? subject.getCode() : ""), undefined);
                    for (let i = 0; i < triplets.length; i++) {

                        let t = new Triplet(
                            row["t" + i + "id"],
                            subConcept,
                            triplets[i].getVerb(),
                            triplets[i].getTarget()
                        );
                        t.setJoinedEntity(triplets[i].getJoinedEntity());
                        ts.push(t);
                    }
                    data.set(subConcept, ts)
                });
            }

            return resolve(data);

        });

    }

    /**
     * Queries database for  all the triplets with given subject id 
     * @param subject 
     * @returns Returns tripets array with given subject id
     */
    async getTripletsBySubject(subject: Concept | undefined, options?: IAbortOption): Promise<Triplet[]> {

        if (subject) {
            let sql = "SELECT t.id as id, " +
                "c.id as subId, c.code as subCode , c.shortname as subSn, " +
                "c1.id as verbId, c1.code as verbCode , c1.shortname as verbSn, " +
                "c2.id as targetId, c2.code as targetCode , c2.shortname as targetSn from " +
                this.tables.get(this.TABLE_TRIPLETS) + " as t join " +
                this.tables.get(this.TABLE_CONCEPTS) + " as c on " +
                "c.id = t.idConceptStart and  t.idConceptStart = ? " +
                "join " + this.tables.get(this.TABLE_CONCEPTS) + " as c1 on c1.id = t.idConceptLink " +
                "join " + this.tables.get(this.TABLE_CONCEPTS) + " as c2 on c2.id = t.idConceptTarget";

            let [rows]: any = await this.getConnectionPool().query(sql, [subject.getId()], options);

            return new Promise((resolve, reject) => {
                if (options?.abort)
                    return reject(new Error("Operation aborted"));

                let triplets: Triplet[] = [];
                if (rows?.length > 0) {
                    rows.forEach((row: any) => {
                        triplets.push(
                            new Triplet(row.id,
                                new Concept(row.subId, row.subCode, row.subSn),
                                new Concept(row.verbId, row.verbCode, row.verbSn),
                                new Concept(row.targetId, row.targetCode, row.targetSn)
                            )
                        );
                    });
                }
                return resolve(triplets);
            });
        }
        else
            return Promise.resolve([]);
    }

    /**
     * Queries database for give concept id from concepts table
     * @param conceptId 
     * @returns Returns promise of Concept with given id
     */
    async getConceptById(conceptId: number, options?: IAbortOption): Promise<Concept | undefined> {

        let sql = "select id, code, shortname from " + this.tables.get(this.TABLE_CONCEPTS) + " where id = ?";
        let [rows]: any = await this.getConnectionPool().query(sql, [conceptId], options);

        return new Promise((resolve, reject) => {
            if (options?.abort)
                return reject(new Error("Operation aborted"));

            if (rows?.length > 0)
                return resolve(new Concept(rows[0].id, rows[0].code, rows[0].shortname));
            return resolve(undefined);

        });
    }

    /**
     * Checks for given triplet in database, if not found then adds it. 
     * @param t 
     * @param withId 
     * @returns Returns added or selected triplet
     */
    async addTriplet(t: Triplet, withId: boolean = false, options?: IAbortOption): Promise<void> {

        let sql = "";

        sql = "select id from " + this.tables.get(this.TABLE_TRIPLETS) + " where idConceptStart = ? and idConceptLink = ? and idConceptTarget = ?";
        let [rows]: any = await this.getConnectionPool().query(sql, t.getDBArrayFormat(false));

        if (rows && rows?.length > 0) {
            t.setId(rows[0].id);
            return Promise.resolve();
        }

        if (withId)
            sql = "insert into " + this.tables.get(this.TABLE_TRIPLETS) + " set id = ?, idConceptStart = ?, idConceptLink = ?, idConceptTarget = ?, flag = ?";
        else
            sql = "insert into " + this.tables.get(this.TABLE_TRIPLETS) + " set idConceptStart = ?, idConceptLink = ?, idConceptTarget = ?, flag = ?";

        const [result]: any = await this.getConnectionPool().query(sql, t.getDBArrayFormat(withId), options);

        if (result && result?.insertId) {
            t.setId(result.insertId);
            return Promise.resolve();
        }

        return Promise.resolve();;

    }

    /**
   * Checks for given triplet in database, if not found then adds it else updates it.
   * @param t 
   * @returns Returns upserted or selected triplet
   */
    async upsertTriplet(t: Triplet, options?: IAbortOption): Promise<void> {

        let sql = "select id from " + this.tables.get(this.TABLE_TRIPLETS) + " where idConceptStart = ? and idConceptLink = ? and idConceptTarget = ? ";
        const [rows]: any = await this.getConnectionPool().query(sql, [t.getSubject()?.getId(), t.getVerb()?.getId(), t.getTarget()?.getId()], options);

        if (rows && rows?.length > 0) {
            // Update
            sql = "update " + this.tables.get(this.TABLE_TRIPLETS) + " set idConceptTarget = ? where id = ?";
            await this.getConnectionPool().query(sql, [t.getTarget()?.getId(), rows[0].id], options);
            t.setId(rows[0].id);
            return Promise.resolve();
        }
        else {
            // Insert
            sql = "insert into " + this.tables.get(this.TABLE_TRIPLETS) + " set idConceptStart = ?, idConceptLink = ?, idConceptTarget = ?, flag = ?";
            const [result]: any = await this.getConnectionPool().query(sql, t.getDBArrayFormat(false), options);
            if (result && result?.insertId) {
                t.setId(result.insertId);
                return Promise.resolve();
            }
        }

        return Promise.resolve();
    }

    /**
   * Checks for given reference in database if not found then adds it.
   * @param ref 
   * @returns Returns added or selected Reference
   */
    async addRefs(ref: Reference, options?: IAbortOption): Promise<void> {

        let sql = "select id from " + this.tables.get(this.TABLE_REFERENCES) + " where idConcept = ? and linkReferenced = ?";
        const [rows]: any = await this.getConnectionPool().query(sql, [ref.getIdConcept()?.getId(), ref.getTripletLink()?.getId()], options);

        if (rows && rows?.length > 0) {
            ref.setId(rows[0].id);
            return Promise.resolve();
        }

        sql = "insert into " + this.tables.get(this.TABLE_REFERENCES) + " set idConcept = ?, linkReferenced = ?, value = ?";
        const [result]: any = await this.getConnectionPool().query(sql, ref.getDBArrayFormat(false), options);

        if (result && result?.insertId) {
            ref.setId(result.insertId);
            return Promise.resolve();
        }

        return Promise.resolve();

    }

    /**
     * Checks for given reference in database if not found then adds it and if found then updates it.
     * @param ref 
     * @returns Returns upserted or selected Reference
     */
    async upsertRefs(ref: Reference, options?: IAbortOption): Promise<void> {

        // Selecting updated or inserted ref
        let sql = "select id from " + this.tables.get(this.TABLE_REFERENCES) + " where idConcept = ? and linkReferenced = ? ";
        const [rows]: any = await this.getConnectionPool().query(sql, [ref.getIdConcept()?.getId(), ref.getTripletLink()?.getId()], options);

        if (rows && rows?.length > 0) {
            ref.setId(rows[0].id);
            sql = "update " + this.tables.get(this.TABLE_REFERENCES) + " set value = ? where idConcept = ? and linkReferenced = ? ";
            await this.getConnectionPool().query(sql, [ref.getValue(), ref.getIdConcept()?.getId(), ref.getTripletLink()?.getId()], options);
            return Promise.resolve();
        }

        // Upserting
        sql = "insert into " + this.tables.get(this.TABLE_REFERENCES) + " (idConcept, linkReferenced, value ) values (?,?,?)";
        const [res]: any = await this.getConnectionPool().query(sql, ref.getDBArrayFormat(false), options);

        if (res && res?.insertId) {
            ref.setId(res.insertId);
            return Promise.resolve();
        }

        return Promise.resolve();

    }

    /**
     * Updates given references in database by check the references ids of given references array. Query by batch. 
     * @param refs 
     * @returns 
     */
    async updateRefsBatchById(refs: Reference[], options?: IAbortOption): Promise<void> {

        let caseStatemet = "";
        let ids = [];

        ids = [...new Set(refs.map(item => (item.getId())))];
        refs.forEach(ref => {
            caseStatemet = caseStatemet + " when id = " + ref.getId() + " then " + ref.getValue()
        });

        let whereStatement = " where id in (" + ids.toString() + ")";
        let sql = "update " + this.tables.get(this.TABLE_REFERENCES) + " set value = ( case " + caseStatemet + " end ) " + whereStatement;

        await this.getConnectionPool().query(sql, undefined, options);

        return Promise.resolve();

    }

    /**
   * Updates given triplets in database by checking the triplet ids. Make sure that triplet objects 
   * in parameter are loaded with ids. Uses batch query.
   * @param triplets 
   * @returns
   */
    async updateTripletsBatchById(triplets: Triplet[], options?: IAbortOption): Promise<void> {

        if (triplets?.length == 0)
            return Promise.resolve();

        let caseStatemet = "";
        let ids = [];
        ids = [...new Set(triplets.map(item => (item.getId())))];
        triplets.forEach(t => {
            caseStatemet = caseStatemet + " when id = " + t.getId() + " then " + t.getTarget()?.getId()
        });
        let whereStatement = " where id in (" + ids.toString() + ")";
        let sql = "update " + this.tables.get(this.TABLE_TRIPLETS) + " set idConceptTarget = ( case " + caseStatemet + " end ) " + whereStatement;
        await this.getConnectionPool().query(sql, undefined, options);

        return Promise.resolve();
    }

    /**
     * Inserts given concepts in database as a batch. 
     * @param concepts 
     * @returns 
     */
    async addConceptsBatch(concepts: Concept[], options?: IAbortOption): Promise<void> {

        let conceptsData: any[] = [];

        concepts?.forEach(concept => {
            conceptsData.push(concept.getDBArrayFormat(false));
        });

        let sql = "insert into " + this.tables.get(this.TABLE_CONCEPTS) + " (code, shortname) values ?";

        let [result]: any = await this.getConnectionPool().query(sql, [conceptsData], options);

        if (result) {
            let insertId: number = result.insertId;
            const affectedRows: number = result.affectedRows;
            for (let i = 0; i < affectedRows; i++) {
                concepts[i].setId(String(insertId));
                insertId = insertId + 1;
            }
        }

        return Promise.resolve();

    }

    /**
  * Inserts given triplets into the database as a batch, includes triplet ids in batch if 
  * withId is set to true 
  * @param triplets 
  * @param withId 
  * @returns 
  */
    async addTripletsBatch(triplets: Triplet[], withId: boolean = true, withIgnore: boolean = true, options?: IAbortOption): Promise<void> {

        let tripletsData: any[] = [];

        triplets?.forEach(t => {
            let arr = t.getDBArrayFormat(withId);
            arr.forEach(a => { if (a && TemporaryId.isValid(a)) throw new Error("Invalid batch insert, unlinked concept found") })
            tripletsData.push(arr);
        });

        let sql = "";

        if (withId)
            sql = "insert into " + this.tables.get(this.TABLE_TRIPLETS) + " (id, idConceptStart, idConceptLink, idConceptTarget, flag) values ?";
        else
            sql = "insert " + (withIgnore ? " ignore " : "") + " into " + this.tables.get(this.TABLE_TRIPLETS) + " (idConceptStart, idConceptLink, idConceptTarget, flag) values ? ";

        let [result]: any = await this.getConnectionPool().query(sql, [tripletsData], options);

        if (result && !withIgnore && !withId) {
            let insertId: number = result.insertId;
            const affectedRows: number = result.affectedRows;
            for (let i = 0; i < affectedRows; i++) {
                triplets[i].setId(String(insertId));
                insertId = insertId + 1;
            }
        }

        return Promise.resolve();

    }

    /**
     * Inserts given refrences into database as a batch, creates auto ids if with withId is set to false otherwise
     * it will run queries to include id also.
     * @param refs 
     * @param withId 
     * @returns 
     */
    async addReferencesBatch(refs: Reference[], withId: boolean = false, options?: IAbortOption): Promise<void> {

        let refsData: any[] = [];

        refs?.forEach(r => {
            let arr = r.getDBArrayFormat(withId);
            arr.forEach(a => { if (a && TemporaryId.isValid(a)) throw new Error("Invalid batch insert, unlinked concept found") })
            refsData.push(arr);
        });

        let values = " (id, idConcept, linkReferenced, value) values ? ";

        if (!withId) {
            values = values = " (idConcept, linkReferenced, value) values ? ";
        }

        let sql = "insert ignore into " + this.tables.get(this.TABLE_REFERENCES) + values;
        await this.getConnectionPool().query(sql, [refsData], options);

        return Promise.resolve();

    }


    async addDataStorage(triplet: Triplet, options?: IAbortOption) {

        let dataStorage = triplet.getStorage();

        if (dataStorage) {
            let sql = "select linkReferenced from " + this.tables.get(this.TABLE_STORAGE) + " where linkReferenced = ?";
            let [rows]: any = await this.getConnectionPool().query(sql, triplet.getId(), options);

            if (rows && rows?.length > 0) {
                // Aleady exist, check if need to be updated 
                if (dataStorage?.isUpsert()) {
                    // Update 
                    sql = "update " + this.tables.get(this.TABLE_STORAGE) + " set value = ?  where linkReferenced = ?";
                    await this.getConnectionPool().query(sql, [dataStorage.getValue(), triplet.getId()], options);
                }
                return;
            }
            sql = "insert into " + this.tables.get(this.TABLE_STORAGE) + " set linkReferenced = ?, value = ?";
            await this.getConnectionPool().query(sql, [triplet.getId(), dataStorage.getValue()], options);
        }

        return;

    }

    async getDataStorageByTriplet(triplet: Triplet, options?: IAbortOption): Promise<void> {

        let sql = "select linkReferenced, value  from " + this.tables.get(this.TABLE_STORAGE) + " where linkReferenced = ?";
        let [rows]: any = await this.getConnectionPool().query(sql, triplet.getId(), options);

        if (rows && rows?.length > 0) {
            triplet.setStorage(rows[0].value);
        }

        return Promise.resolve();

    }

    async getBalanceForAddress(address: string, conceptsIds: string[], options?: IAbortOption) {

        let sql = "SELECT" +
            " c1.shortname as blockchain, " +
            " t4.idConceptTarget as contractId," +
            " r2.value as tokenId," +
            " SUM(CASE WHEN t5.idConceptLink = 76 THEN r1.value ELSE - r1.value END) as quantity" +
            " FROM jetski.fondue_SandraTriplets as t1 " +
            " join jetski.fondue_SandraTriplets as t2 on t1.idConceptStart = t2.idConceptStart" +
            " join jetski.fondue_SandraTriplets as t3 on t1.idConceptStart = t3.idConceptStart" +
            " join jetski.fondue_SandraTriplets as t4 on t1.idConceptStart = t4.idConceptStart" +
            " join jetski.fondue_SandraTriplets as t5 on t1.idConceptStart = t5.idConceptStart" +
            " join jetski.fondue_SandraReferences as r1 on t1.id = r1.linkReferenced " +
            " join jetski.fondue_SandraReferences as r2 on t4.id = r2.linkReferenced " +
            " join jetski.fondue_SandraConcept as c1 on t3.idConceptTarget = c1.id " +
            " and t1.idConceptLink = ? and t1.idConceptTarget = ? /* contained_in_file => blockchainEventFile */" +
            " and t2.idConceptLink = ? and t2.idConceptTarget = ? /* is_a  => blockchainEvent */" +
            " and t3.idConceptLink = ? /* onBlockchain verb */" +
            " and t4.idConceptLink = ? /* blockchainContract verb  */" +
            " and r1.idConcept = ? /* concept subject id for quantity */" +
            " and r2.idConcept = ? /* concept subject id for tokenid  */" +
            " and" +
            " (" +
            "    (t5.idConceptLink = ? and t5.idConceptTarget = ?) " +
            "     or" +
            "    (t5.idConceptLink = ? and t5.idConceptTarget = ?) " +
            " )" +
            " group by blockchain, contractId, tokenId " +
            " having(quantity != 0) ";

        let [rows]: any = await this.getConnectionPool().query(sql, conceptsIds, options);

        if (rows && rows?.length > 0) {
            return Promise.resolve(rows);
        }

        return Promise.resolve([]);

    }
}
