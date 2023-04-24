import mysql from "mysql2/promise";
import { Sandra } from "./Sandra";
import { IDBConfig } from "./interfaces/IDBconfig";
import { LogManager } from "./loggers/LogManager";
import { IQueryOption } from "./interfaces/IQueryOption";
import { IDBQueryOption } from "./interfaces/IDBQueryOption";
import { Concept } from "./Concept";
import { Reference } from "./Reference";
import { Triplet } from "./Triplet";
import { Entity } from "./Entity";
import { TemporaryId } from "./TemporaryId";

export class DBAdapter {

    private readonly TABLE_CONCEPTS = "concepts";
    private readonly TABLE_REFERENCES = "references";
    private readonly TABLE_TRIPLETS = "triplets";

    private readonly config: IDBConfig;

    private static instance?: DBAdapter;
    private connection?: mysql.PoolConnection;

    private queryOption: IQueryOption;
    private tables: Map<string, string> = new Map<string, string>();

    private constructor(config: IDBConfig) {
        this.config = config;
        this.queryOption = {
            timeout: 300000,
            abortController: undefined,
            abort: false
        };
        this.tables.set(this.TABLE_CONCEPTS, this.config.env + "_SandraConcept");
        this.tables.set(this.TABLE_REFERENCES, this.config.env + "_SandraReferences");
        this.tables.set(this.TABLE_TRIPLETS, this.config.env + "_SandraTriplets");
    }

    /**
     * 
     * @returns Returns DBAdapter object, if null then new object is created.
     */
    public static async getInstance(): Promise<DBAdapter> {

        if (!DBAdapter.instance) {
            DBAdapter.instance = new DBAdapter(Sandra.DB_CONFIG);
            await DBAdapter.instance.connect();
        }
        return DBAdapter.instance;
    }

    /**
     * 
     * @returns Returns current DBAdapter instance object.
     */
    public static getInstanceObject(): (DBAdapter | undefined) { return DBAdapter.instance; }

    /**
     * Connects to mySQL database with configuration set with Sandra.DB_CONFIG 
     */
    async connect() {
        try {
            LogManager.getInstance().info("Creating db connection..");

            this.connection = await mysql.createPool({
                user: this.config.user,
                password: this.config.password,
                host: this.config.host,
                database: this.config.database,
                waitForConnections: this.config.waitForConnections ? this.config.waitForConnections : true,
                connectionLimit: this.config.connectionLimit ? this.config.connectionLimit : 10,
                queueLimit: this.config.queueLimit ? this.config.queueLimit : 0
            }).getConnection();

            this.connection.on('connect', () => {
                console.log('Connection established.');
            });

            this.connection.on('enqueue', () => {
                console.log('Query added to queue.');
            });

            this.connection.on('release', () => {
                console.log('Connection released.');
            });

            this.connection.on('error', (error) => {
                console.log(`Error occurred: ${error}`);
            });

            this.connection.on('end', () => {
                console.log('Connection closed.');
            });

            this.connection.on('close', () => {
                console.log('Socket closed.');
            });


        } catch (e: any) {
            LogManager.getInstance().error(e);
        }
    }

    /**
     * 
     * @returns Returns DB connection class object
     */
    private getConnection() {
        if (this.connection) return this.connection;
        else throw Error("DB not connected");
    }

    /**
     * Closes the DB connection
     */
    async close() {
        try {
            if (this.connection) {
                await this.connection.end();
                DBAdapter.instance = undefined;
            }
        } catch (e: any) {
            LogManager.getInstance().error(e);
        }
    }

    /**
     * Force closes db connection or any running queries
     * Usecase for abort signals 
     */
    async destroy() {
        try {
            if (this.connection) {
                this.connection.destroy();
                DBAdapter.instance = undefined;
            }
        } catch (e: any) {
            LogManager.getInstance().error(e);
        }
    }
    /**
     * Begins DB transaction. 
     */
    async beginTransaction() {
        LogManager.getInstance().info("Starting transaction..")
        let sql = "Start Transaction;";
        await this.getConnection().query(sql);
    }

    /**
     * Commits DB transactions.
     */
    async commit() {
        LogManager.getInstance().info("Committing tranaction..")
        let sql = "Commit;";
        await this.getConnection().query(sql);
    }

    /**
     * Runs DB query to sleep for given durations. 
     * @param durationInSec 
     */
    async sleep(durationInSec: number) {
        LogManager.getInstance().info("Sleep for " + durationInSec + "s");
        let sql = "select sleep(" + durationInSec + ")";
        await this.getConnection().query(sql);
    }

    /***
     * Abort function to stop running queries 
     */
    abort() {
        LogManager.getInstance().info("Aborting connection..");
        this.destroy();
    }


    getDBQueryOption(sql: string, option?: IQueryOption): IDBQueryOption {

        if (option?.abortController) {
            option.abortController.signal.addEventListener("abort", (() => {
                this.abort();
                option.abort = true;
            }).bind(this));
        }

        return { sql, timeout: (option?.timeout || this.queryOption.timeout) } as IDBQueryOption;
    }


    /**
     * Queries database concepts table for given shortname
     * @param shortname 
     * @returns Returns promise of concept with given shortname
     */
    async getConcept(shortname: string, options?: IQueryOption): Promise<Concept | undefined> {

        let sql = "select * from " + this.tables.get(this.TABLE_CONCEPTS) + " where shortname = ?";
        const [rows, fields] = await this.getConnection().query(this.getDBQueryOption(sql, options), shortname);

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
    async addConcept(c: Concept, withId: boolean = false, options?: IQueryOption): Promise<Concept | undefined> {

        let sql = "insert ignore into " + this.tables.get("concepts") + " set code = ?, shortname = ?";

        if (withId)
            sql = "insert ignore into " + this.tables.get("concepts") + " set id = ?, code = ?, shortname = ?";

        const [result] = await this.getConnection().query(this.getDBQueryOption(sql, options), c.getDBArrayFormat(withId));

        return new Promise((resolve, reject) => {

            if (result && (result as any).insertId) {
                c.setId((result as any).insertId);
                return resolve(c);
            }

            return resolve(undefined)

        });

    }


    /**
     * Queries database for references attached to given triplet and if reference concept is provided 
     * then only those reference concepts are selected
     * @param t 
     * @param refConcept 
     * @returns Returns Reference class object of given triplet.
     */
    async getReferenceByTriplet(triplet: Triplet, refConcept?: Concept, options?: IQueryOption): Promise<Reference[]> {

        let refCon = "";
        let v = [triplet.getId()];

        if (refConcept) {
            refCon = " and r.idConcept in (?)"
            v = [...v, refConcept.getId()];
        }

        let sql = "select r.id, c.id as cId, c.code, c.shortname, r.value from "
            + this.tables.get(this.TABLE_REFERENCES) + " as r " + " join "
            + this.tables.get("concepts") + " as c on r.idConcept = c.id and r.linkReferenced = ?" + refCon;

        let [rows]: any = await this.getConnection().query(this.getDBQueryOption(sql, options), v);

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
    async getReferenceByTriplets(triplets: Triplet[], options?: IQueryOption): Promise<Reference[]> {

        let sql = "select r.id,  r.linkReferenced as tripletId, c.id as cId, c.code, c.shortname, r.value from " +
            this.tables.get(this.TABLE_REFERENCES) + " as r join " +
            this.tables.get("concepts") + " as c " +
            " on r.idConcept = c.id and r.linkReferenced in (?)";

        let v: string[] = triplets.map(t => t.getId());
        let [rows]: any = await this.getConnection().query(this.getDBQueryOption(sql, options), [v]);

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
    async getEntityTriplet(verb: Concept, target: Concept, ref: Reference | undefined, limit: number = 9999999, options?: IQueryOption): Promise<Triplet[]> {

        let sql = "", rows: any;

        if (ref) {
            sql = "select t.id, c.id as subjectId, c.code as subjectCode, c.shortname as subjectShortname, t.idConceptLink as verb, t.idConceptTarget as target from " +
                this.tables.get(this.TABLE_TRIPLETS) + " as t join  " +
                this.tables.get(this.TABLE_REFERENCES) + " as r " +
                " on t.id = r.linkReferenced and t.idConceptLink = ? and t.idConceptTarget = ? and r.value = ? and r.idConcept = ? join " +
                this.tables.get(this.TABLE_CONCEPTS) + " as c on t.idConceptStart = c.id limit ?";

            [rows] = await this.getConnection().query(this.getDBQueryOption(sql, options), [verb.getId(), target.getId(), ref.getValue(), ref.getIdConcept()?.getId(), limit]);
        }
        else {
            sql = "select t.id, c.id as subjectId, c.code as subjectCode, c.shortname as subjectShortname, t.idConceptLink as verb, t.idConceptTarget as target from " +
                this.tables.get(this.TABLE_TRIPLETS) + " as t join " +
                this.tables.get(this.TABLE_CONCEPTS) + " as c on  t.idConceptStart = c.id and  t.idConceptLink = ? and t.idConceptTarget = ? limit ? ";

            [rows] = await this.getConnection().query(this.getDBQueryOption(sql, options), [verb.getId(), target.getId(), limit]);
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
     * Queries database for triplets with given subjects and verb concepts. Loads verb concept data also if
     * loadVerbData is set to true.
     * @param subjects 
     * @param verbs 
     * @param loadVerbData 
     * @returns Returns array of triplets for given subject and verb
     */
    async getTriplets(subjects: Concept[], verbs: Concept[] | undefined = undefined, loadVerbData: boolean = false, options?: IQueryOption): Promise<Triplet[]> {

        let subConcept = subjects.map(s => s.getId());
        let verbConcept = verbs?.map(v => v.getId());

        let sql = "select c.id as cId, c.shortname as cSN, c.code as cCode , t.id as id, t.idConceptStart as subId, t.idConceptLink as verbId, t.idConceptTarget as targetId #VERB_SELECT# from " +
            this.tables.get("triplets") + " as t join " +
            this.tables.get("concepts") + " as c on c.id = t.idConceptTarget and t.idConceptStart in (?)";

        if (loadVerbData) {
            sql = sql.replace("#VERB_SELECT#", " , c1.code as verbCode, c1.shortname as verbSn ")
        } else
            sql = sql.replace("#VERB_SELECT#", " , null as verbCode, null as verbSn ")

        let rows: any;

        if (verbConcept && verbConcept?.length > 0) {
            sql = sql + " and t.idConceptLink in (?)";
            if (loadVerbData) {
                sql = sql + " join " + this.tables.get("concepts") + " as c1 on c1.id = t.idConceptLink "
            }
            [rows] = await this.getConnection().query(this.getDBQueryOption(sql, options), [subConcept, verbConcept]);
        }
        else {
            if (loadVerbData) {
                sql = sql + " join " + this.tables.get("concepts") + " as c1 on c1.id = t.idConceptLink "
            }
            [rows] = await this.getConnection().query(this.getDBQueryOption(sql, options), [subConcept])
        };

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
                            new Concept(row.verbId, row.verbCode, row.verbSn),
                            new Concept(row.cId, row.cCode, row.cSN)
                        )
                    );
                });
            }
            return resolve(triplets);
        });


    }


    /**
  * Queries database for give verb, target and refs values.
  * @param verb 
  * @param target 
  * @param refsValuesToSearch 
  * @param refConcept 
  * @returns Returns map of reference value and corresponding Concept
  */
    async getEntityConceptsByRefs(verb: Concept, target: Concept, refsValuesToSearch: string[], refConcept: Concept, options?: IQueryOption): Promise<Map<string, Concept>> {

        let sql = "select  c.id, c.code, c.shortname, r.value from " +
            this.tables.get("references") + "  as r " +
            " join " + this.tables.get("triplets") + " as t on t.id = r.linkReferenced" +
            " join " + this.tables.get("concepts") + " as c on t.idConceptStart = c.id" +
            " and r.value in ( ? ) " +
            " and r.idConcept = ? " +
            " and t.idConceptLink =  ? " +
            " and t.idConceptTarget = ? ";

        let [rows]: any = await this.getConnection().query(this.getDBQueryOption(sql, options), [refsValuesToSearch, refConcept.getId(), verb.getId(), target.getId()]);

        return new Promise((resolve, reject) => {
            if (options?.abort)
                return reject(new Error("Operation aborted"));
            let map: Map<string, Concept> = new Map();
            if (rows?.length > 0) {
                rows.forEach((row: any) => {
                    map.set(row.value.toString(), new Concept(row.id, row.code, row.shortname));
                });
            }
            return resolve(map);
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
    async filter(triplets: Triplet[], refs: Reference[], limit: number = 1000, options?: IQueryOption): Promise<Map<Concept, Triplet[]>> {

        let sql = "";
        let subject: Concept | undefined;
        let data: Map<Concept, Triplet[]> = new Map();

        // Add triplet filter
        if (triplets?.length > 0) {
            subject = triplets[0].getSubject();
            sql = "select t0.id as t0id, t0.idConceptStart t0idConceptStart ,#SELECT# from " + this.tables.get("triplets") + " as t0 ";

            for (let index = 1; index < triplets.length; index++) {
                let t = triplets[index];
                sql = sql.replace("#SELECT#", "t" + index + ".id as t" + index + "id ,#SELECT#");
                sql = sql + " join " + this.tables.get("triplets") + " as t" + index + " on t0.idConceptStart = " + "t" + index + ".idConceptStart";
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
                    sql = sql + " join " + this.tables.get("references") + " as r" + index + " on t" + i + ".id = r" + index + ".linkReferenced";
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

        sql = sql.replace(",#SELECT#", " ") + " limit " + limit;

        let [rows]: any = await this.getConnection().query(this.getDBQueryOption(sql, options));

        return new Promise((resolve, reject) => {

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
    async getTripletsBySubject(subject: Concept | undefined, options?: IQueryOption): Promise<Triplet[]> {

        if (subject) {
            let sql = "SELECT t.id as id, " +
                "c.id as subId, c.code as subCode , c.shortname as subSn, " +
                "c1.id as verbId, c1.code as verbCode , c1.shortname as verbSn, " +
                "c2.id as targetId, c2.code as targetCode , c2.shortname as targetSn from " +
                this.tables.get("triplets") + " as t join " +
                this.tables.get("concepts") + " as c on " +
                "c.id = t.idConceptStart and  t.idConceptStart = ? " +
                "join " + this.tables.get("concepts") + " as c1 on c1.id = t.idConceptLink " +
                "join " + this.tables.get("concepts") + " as c2 on c2.id = t.idConceptTarget";

            let [rows]: any = await this.getConnection().query(this.getDBQueryOption(sql, options), [subject.getId()]);

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
    async getConceptById(conceptId: number, options?: IQueryOption): Promise<Concept | undefined> {

        let sql = "select id, code, shortname from " + this.tables.get("concepts") + " where id = ?";
        let [rows]: any = await this.getConnection().query(this.getDBQueryOption(sql, options), [conceptId]);

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
    async addTriplet(t: Triplet, withId: boolean = false, options?: IQueryOption): Promise<void> {

        let sql = "";

        sql = "select id from " + this.tables.get("triplets") + " where idConceptStart = ? and idConceptLink = ? and idConceptTarget = ?";
        let [rows]: any = await this.getConnection().query(this.getDBQueryOption(sql, options), t.getDBArrayFormat(false));

        if (rows && rows?.length > 0) {
            t.setId(rows[0].id);
            return Promise.resolve();
        }

        if (withId)
            sql = "insert into " + this.tables.get("triplets") + " set id = ?, idConceptStart = ?, idConceptLink = ?, idConceptTarget = ?, flag = ?";
        else
            sql = "insert into " + this.tables.get("triplets") + " set idConceptStart = ?, idConceptLink = ?, idConceptTarget = ?, flag = ?";

        const [result]: any = await this.getConnection().query(this.getDBQueryOption(sql, options), t.getDBArrayFormat(withId));

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
    async upsertTriplet(t: Triplet, options?: IQueryOption): Promise<void> {

        let sql = "select id from " + this.tables.get("triplets") + " where idConceptStart = ? and idConceptLink = ?";
        const [rows]: any = await this.getConnection().query(this.getDBQueryOption(sql, options), [t.getSubject()?.getId(), t.getVerb()?.getId()]);

        if (rows && rows?.length > 0) {
            // Update
            sql = "update " + this.tables.get("triplets") + " set idConceptTarget = ? where id = ?";
            await this.getConnection().query(this.getDBQueryOption(sql, options), [t.getTarget()?.getId(), rows[0].id]);
            t.setId(rows[0].id);
            return Promise.resolve();
        }
        else {
            // Insert
            sql = "insert into " + this.tables.get("triplets") + " set idConceptStart = ?, idConceptLink = ?, idConceptTarget = ?, flag = ?";
            const [result]: any = await this.getConnection().query(this.getDBQueryOption(sql, options), t.getDBArrayFormat(false));
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
    async addRefs(ref: Reference, options?: IQueryOption): Promise<void> {

        let sql = "select id from " + this.tables.get("references") + " where idConcept = ? and linkReferenced = ?";
        const [rows]: any = await this.getConnection().query(this.getDBQueryOption(sql, options), [ref.getIdConcept()?.getId(), ref.getTripletLink()?.getId()]);

        if (rows && rows?.length > 0) {
            ref.setId(rows[0].id);
            return Promise.resolve();
        }

        sql = "insert into " + this.tables.get("references") + " set idConcept = ?, linkReferenced = ?, value = ?";
        const [result]: any = await this.getConnection().query(this.getDBQueryOption(sql, options), ref.getDBArrayFormat(false));

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
    async upsertRefs(ref: Reference, options?: IQueryOption): Promise<void> {

        // Selecting updated or inserted ref
        let sql = "select id from " + this.tables.get("references") + " where idConcept = ? and linkReferenced = ? ";
        const [rows]: any = await this.getConnection().query(this.getDBQueryOption(sql, options), [ref.getIdConcept()?.getId(), ref.getTripletLink()?.getId()]);

        if (rows && rows?.length > 0) {
            ref.setId(rows[0].id);
            sql = "update " + this.tables.get("references") + " set value = ? where idConcept = ? and linkReferenced = ? ";
            await this.getConnection().query(this.getDBQueryOption(sql, options), [ref.getValue(), ref.getIdConcept()?.getId(), ref.getTripletLink()?.getId()]);
            return Promise.resolve();
        }

        // Upserting
        sql = "insert into " + this.tables.get("references") + " (idConcept, linkReferenced, value ) values (?,?,?)";
        const [res]: any = await this.getConnection().query(this.getDBQueryOption(sql, options), ref.getDBArrayFormat(false));

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
    async updateRefsBatchById(refs: Reference[], options?: IQueryOption): Promise<void> {

        let caseStatemet = "";
        let ids = [];

        ids = [...new Set(refs.map(item => (item.getId())))];
        refs.forEach(ref => {
            caseStatemet = caseStatemet + " when id = " + ref.getId() + " then " + ref.getValue()
        });

        let whereStatement = " where id in (" + ids.toString() + ")";
        let sql = "update " + this.tables.get("references") + " set value = ( case " + caseStatemet + " end ) " + whereStatement;

        await this.getConnection().query(this.getDBQueryOption(sql, options));

        return Promise.resolve();

    }

    /**
   * Updates given triplets in database by checking the triplet ids. Make sure that triplet objects 
   * in parameter are loaded with ids. Uses batch query.
   * @param triplets 
   * @returns
   */
    async updateTripletsBatchById(triplets: Triplet[], options?: IQueryOption): Promise<void> {

        if (triplets?.length == 0)
            return Promise.resolve();

        let caseStatemet = "";
        let ids = [];
        ids = [...new Set(triplets.map(item => (item.getId())))];
        triplets.forEach(t => {
            caseStatemet = caseStatemet + " when id = " + t.getId() + " then " + t.getTarget()?.getId()
        });
        let whereStatement = " where id in (" + ids.toString() + ")";
        let sql = "update " + this.tables.get("triplets") + " set idConceptTarget = ( case " + caseStatemet + " end ) " + whereStatement;
        await this.getConnection().query(this.getDBQueryOption(sql, options));

        return Promise.resolve();
    }

    /**
     * Inserts given concepts in database as a batch. 
     * @param concepts 
     * @returns 
     */
    async addConceptsBatch(concepts: Concept[], options?: IQueryOption): Promise<void> {

        let conceptsData: any[] = [];

        concepts?.forEach(concept => {
            conceptsData.push(concept.getDBArrayFormat(false));
        });

        let sql = "insert into " + this.tables.get("concepts") + " (code, shortname) values ?";

        let [result]: any = await this.getConnection().query(this.getDBQueryOption(sql, options), [conceptsData]);

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
    async addTripletsBatch(triplets: Triplet[], withId: boolean = true, withIgnore: boolean = true, options?: IQueryOption): Promise<void> {

        let tripletsData: any[] = [];

        triplets?.forEach(t => {
            let arr = t.getDBArrayFormat(withId);
            arr.forEach(a => { if (a && TemporaryId.isValid(a)) throw new Error("Invalid batch insert, unlinked concept found") })
            tripletsData.push(arr);
        });

        let sql = "";

        if (withId)
            sql = "insert into " + this.tables.get("triplets") + " (id, idConceptStart, idConceptLink, idConceptTarget, flag) values ?";
        else
            sql = "insert " + (withIgnore ? " ignore " : "") + " into " + this.tables.get("triplets") + " (idConceptStart, idConceptLink, idConceptTarget, flag) values ? ";

        let [result]: any = await this.getConnection().query(this.getDBQueryOption(sql, options), [tripletsData]);

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
    async addReferencesBatch(refs: Reference[], withId: boolean = false, options?: IQueryOption): Promise<void> {

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

        let sql = "insert ignore into " + this.tables.get("references") + values;
        await this.getConnection().query(this.getDBQueryOption(sql, options), [refsData]);

        return Promise.resolve();

    }


    /**
  * 
  * @returns Returns max id of SandraConcept table
  */
    async getMaxConceptId(options?: IQueryOption): Promise<string> {

        let sql = "select max(id) as id from " + this.tables.get("concepts");
        let [rows]: any = await this.getConnection().query(this.getDBQueryOption(sql, options));

        if (rows?.length > 0)
            return Promise.resolve(rows[0].id);

        return Promise.reject();

    }

    /**
     * 
     * @returns Returns max if of SandraTriplets table
     */
    async getMaxTripletId(): Promise<string> {

        let sql = "select max(id) as id from " + this.tables.get("triplets");
        let [rows]: any = await this.getConnection().query(sql);

        if (rows?.length > 0)
            return Promise.resolve(rows[0].id);

        return Promise.reject();

    }

    /**
     * 
     * @returns Returns max id from SandraReferences table
     */
    async getMaxReferenceId(): Promise<string> {

        let sql = "select max(id) as id from " + this.tables.get("references");
        let [rows]: any = await this.getConnection().query(sql);

        if (rows?.length > 0)
            return Promise.resolve(rows[0].id);

        return Promise.reject();

    }


    /**
     * Test function for DB connection and query 
     */
    async testDB(option?: IQueryOption) {
        try {
            let sql = "select * from " + this.tables.get(this.TABLE_CONCEPTS) + " order by id desc;";
            let query = this.getDBQueryOption(sql, option)
            this.sleep(1);
            this.getConnection().query(query).then(r => {
                console.log(r);
            });
        }
        catch (e) {
            LogManager.getInstance().error(e);
        }
    }


}
