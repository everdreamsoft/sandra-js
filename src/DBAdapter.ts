import * as mariaDb from "mariadb";
import { Connection } from "mariadb";
import { Concept } from "./Concept";
import { Entity } from "./Entity";
import { EnumLockStatus } from "./enums/lock-status";
import { EnumTransactionStatus } from "./enums/transaction-status";
import { IDBConfig } from "./interfaces/IDBconfig";
import { LogManager } from "./loggers/LogManager";
import { Reference } from "./Reference";
import { Sandra } from "./Sandra";
import { TemporaryId } from "./TemporaryId";
import { Triplet } from "./Triplet";
import { Utils } from "./Utils";

export class DBAdapter {

    private static instance: DBAdapter;

    private connection: Connection | undefined;
    private tables: Map<string, string> = new Map<string, string>();

    private readonly config: IDBConfig;
    private transactionStatus: EnumTransactionStatus;
    private tableLockStatus: EnumLockStatus;


    private constructor(config: IDBConfig) {

        this.config = config;
        this.transactionStatus = EnumTransactionStatus.Completed;
        this.tableLockStatus = EnumLockStatus.Off;
        this.tables.set("concepts", this.config.env + "_SandraConcept");
        this.tables.set("references", this.config.env + "_SandraReferences");
        this.tables.set("triplets", this.config.env + "_SandraTriplets");
        this.tables.set("maxid", this.config.env + "_maxid");

    }

    public static async getInstance(): Promise<DBAdapter> {

        if (!DBAdapter.instance) {
            DBAdapter.instance = new DBAdapter(Sandra.DB_CONFIG);
            await DBAdapter.instance.connect();
        }


        return DBAdapter.instance;
    }

    public static getInstanceObject(): DBAdapter { return DBAdapter.instance; }

    async connect() {
        try {
            LogManager.getInstance().info("Creating DB connection..");
            this.connection = await mariaDb.createConnection(this.config);
        } catch (e) {
            console.error(e);
        }
    }

    private getConnection() {
        if (this.connection) return this.connection;
        else throw Error("DB not connected");
    }

    async close() {
        try {
            if (this.connection) {
                await this.connection.end();
                DBAdapter.instance = null;
            }
        } catch (e) {
            console.error(e);
        }
    }

    async beginTransaction() {
        LogManager.getInstance().info("Starting transaction..")
        let sql = "Start Transaction;";
        await this.getConnection().query(sql);
        this.transactionStatus = EnumTransactionStatus.Started;
    }

    async commit() {
        LogManager.getInstance().info("Committing..")
        let sql = "Commit;";
        await this.getConnection().query(sql);
        this.transactionStatus = EnumTransactionStatus.Completed;
    }

    async sleep(durationInSec: number) {
        LogManager.getInstance().info("Sleep for " + durationInSec + "s");
        let sql = "select sleep(" + durationInSec + ")";
        await this.getConnection().query(sql);

    }

    async lockTables(concept: boolean = false, triplet: boolean = false, ref: boolean = false) {

        let tables = [];

        if (concept)
            tables.push(this.tables.get("concepts") + " WRITE");

        if (triplet)
            tables.push(this.tables.get("triplets") + " WRITE");

        if (ref)
            tables.push(this.tables.get("references") + " WRITE");

        if (tables.length > 0) {
            LogManager.getInstance().info("Unlocking tables.." + tables.toString());
            let sql = "LOCK TABLES " + tables.toString() + ";";
            await this.getConnection().query(sql);
        }

    }

    async unlockTable() {
        LogManager.getInstance().info("Unlocking tables..");
        let sql = "UNLOCK TABLES";
        await this.getConnection().query(sql);
    }

    async getReferenceByTriplet(t: Triplet, refConcept: Concept = null): Promise<Reference[]> {

        let refCon = "";

        if (refConcept) {
            refCon = " and r.idConcept in (?)"
        }

        let sql = "select r.id, c.id as cId, c.code, c.shortname, r.value from " + this.tables.get("references") + " as r " +
            " join " + this.tables.get("concepts") + " as c on r.idConcept = c.id and r.linkReferenced = ?" + refCon;

        let v = [t.getId()];

        if (refCon)
            v = [...v, refConcept.getId()];

        let res: any = await this.getConnection().query(sql, v);

        let refs: Reference[] = [];

        if (res?.length > 0) {

            res.forEach(row => {
                refs.push(
                    new Reference(row.id,
                        new Concept(row.cId, row.code, row.shortname),
                        t,
                        row.value
                    )
                );
            });
        }

        return refs;

    }

    async getReferenceByTriplets(triplets: Triplet[]): Promise<Reference[]> {

        let sql = "select r.id,  r.linkReferenced as tripletId, c.id as cId, c.code, c.shortname, r.value from " + this.tables.get("references") + " as r " +
            " join " + this.tables.get("concepts") + " as c on r.idConcept = c.id and r.linkReferenced in (?)";

        let v = [];

        triplets.map(t => { v = [...v, t.getId()] });

        let res: any = await this.getConnection().query(sql, [v]);

        let refs: Reference[] = [];

        if (res?.length > 0) {

            res.forEach(row => {
                refs.push(
                    new Reference(row.id,
                        new Concept(row.cId, row.code, row.shortname),
                        new Triplet(row.tripletId, null, null, null),
                        row.value
                    )
                );
            });
        }

        return refs;

    }

    /**
     *  Get the triplet attached with given verb and target linked to given reference
     */
    async getEntityTriplet(verb: Concept, target: Concept, ref: Reference, limit: number = 1000): Promise<Triplet[]> {

        let sql = "";
        let res = [];

        if (ref) {
            sql = "select t.id, c.id as subjectId, c.code as subjectCode, c.shortname as subjectShortname, t.idConceptLink as verb, t.idConceptTarget as target from " + this.tables.get("triplets") + " as t join  " + this.tables.get("references") + " as r" +
                " on t.id = r.linkReferenced and t.idConceptLink = ? and t.idConceptTarget = ? and r.value = ? and" +
                " r.idConcept = ? join " + this.tables.get("concepts") + " as c on t.idConceptStart = c.id limit ?";
            res = await this.getConnection().query(sql, [verb.getId(), target.getId(), ref.getValue(), ref.getIdConcept().getId(), limit]);
        }
        else {
            sql = "select t.id, c.id as subjectId, c.code as subjectCode, c.shortname as subjectShortname, t.idConceptLink as verb, t.idConceptTarget as target from " + this.tables.get("triplets") + " as t join " +
                this.tables.get("concepts") + " as c on  t.idConceptStart = c.id and  t.idConceptLink = ? and t.idConceptTarget = ? limit ? ";
            res = await this.getConnection().query(sql, [verb.getId(), target.getId(), limit]);
        }

        let triplets: Triplet[] = [];

        if (res?.length > 0) {

            res.forEach(row => {
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

        return triplets;

    }

    async getTriplets(subjects: Concept[], verbs: Concept[] = null, loadVerbData: boolean = false) {

        let subConcept = [];
        let verbConcept = [];

        subjects.forEach((subject) => {
            subConcept.push(subject.getId())
        });

        verbs?.forEach((verb) => {
            verbConcept.push(verb.getId())
        });

        let sql = "select c.id as cId, c.shortname as cSN, c.code as cCode , t.id as id, t.idConceptStart as subId, t.idConceptLink as verbId, t.idConceptTarget as targetId #VERB_SELECT# from "
            + this.tables.get("triplets")
            + " as t join " + this.tables.get("concepts") + " as c on c.id = t.idConceptTarget "
            + " and t.idConceptStart in (?)";

        if (loadVerbData) {
            sql = sql.replace("#VERB_SELECT#", " , c1.code as verbCode, c1.shortname as verbSn ")
        } else
            sql = sql.replace("#VERB_SELECT#", " , null as verbCode, null as verbSn ")


        let res: any;

        if (verbs?.length > 0) {
            sql = sql + " and t.idConceptLink in (?)";
            if (loadVerbData) {
                sql = sql + " join " + this.tables.get("concepts") + " as c1 on c1.id = t.idConceptLink "
            }
            res = await this.getConnection().query(sql, [subConcept, verbConcept]);
        }
        else {
            if (loadVerbData) {
                sql = sql + " join " + this.tables.get("concepts") + " as c1 on c1.id = t.idConceptLink "
            }
            res = await this.getConnection().query(sql, [subConcept])
        };

        let triplets: Triplet[] = [];

        if (res?.length > 0) {
            res.forEach((row: any) => {
                triplets.push(
                    new Triplet(
                        row.id,
                        new Concept(row.subId, null, null),
                        new Concept(row.verbId, row.verbCode, row.verbSn),
                        new Concept(row.cId, row.cCode, row.cSN)
                    )
                );
            });
        }

        return triplets;

    }

    async getEntityConceptsByRefs(verb: Concept, target: Concept, refsValuesToSearch: string[], refConcept: Concept): Promise<Map<string, Concept>> {

        // let refs = refsValuesToSearch.map(function (id) { return "'" + id + "'"; }).join(",");

        let sql = "select  c.id, c.code, c.shortname, r.value from " +
            this.tables.get("references") + "  as r " +
            " join " + this.tables.get("triplets") + " as t on t.id = r.linkReferenced" +
            " join " + this.tables.get("concepts") + " as c on t.idConceptStart = c.id" +
            " and r.value in ( ? ) " +
            " and r.idConcept = ? " +
            " and t.idConceptLink =  ? " +
            " and t.idConceptTarget = ? ";

        let res: any = await this.getConnection().query(sql, [refsValuesToSearch, refConcept.getId(), verb.getId(), target.getId()]);

        let map: Map<string, Concept> = new Map();

        if (res?.length > 0) {
            res.forEach(row => {
                map.set(row.value.toString(), new Concept(row.id, row.code, row.shortname));
            });
        }

        return map;

    }

    // Load all subject concpets for given triplet 
    async getEntitiesByTriplet(t: Triplet[], limit: number = 1000) {

        let sql = "";
        let subject = t[0].getSubject();
        let selectTripletId = [];

        if (t.length > 1) {

            selectTripletId.push("t0.id as t0id");

            sql = "select t0.idConceptStart as idConceptStart , #ID# from " + this.tables.get("triplets") + " as t0";

            for (let i = 1; i < t.length; i++) {
                let table = "t" + (i).toString();
                selectTripletId.push(table + ".id as " + table + "id")
                sql = sql + " join " + this.tables.get("triplets") + " as " + table +
                    " on " + table + ".idConceptStart = t0." + "idConceptStart and " +
                    table + ".idConceptLink = " + t[i].getVerb().getId() + " and " +
                    table + ".idConceptTarget = " + t[i].getTarget().getId() + " ";
            }
            sql = sql + " and t0.idConceptLink = " + t[0].getVerb().getId() + " and t0.idConceptTarget = " +
                t[0].getTarget().getId();

            sql = sql + " join " + this.tables.get("concepts") + " as c on c.id = t0.idConceptStart  and c.code = '" + subject.getCode() + "' limit " + limit;

            sql = sql.replace("#ID#", selectTripletId.toString());

        }
        else {
            sql = "select t.idConceptStart as idConceptStart, t.id as t0id from " + this.tables.get("triplets") + " as t join " +
                this.tables.get("concepts") + " as c on c.id = t.idConceptStart and " +
                "t.idConceptLink = " + t[0].getVerb().getId() + " and t.idConceptTarget = " + t[0].getTarget().getId()
                + " and c.code = '" + subject.getCode() + "' limit " + limit;
        }

        let res: any = await this.getConnection().query(sql);
        let data: Map<Concept, Triplet[]> = new Map();

        if (res?.length > 0) {
            res.forEach(row => {
                let triplets: Triplet[] = [];
                for (let i = 0; i < t.length; i++) {
                    triplets.push(
                        new Triplet(
                            row["t" + i + "id"],
                            subject,
                            t[i].getVerb(),
                            t[i].getTarget()
                        )
                    );
                }
                data.set(new Concept(row.idConceptStart, subject.getCode(), null), triplets)
            });
        }

        return data;

    }

    // Filter by triplets and refernce, if a refrence is added then reference should have 
    // tripletLink set and this triplet should be provided with triplets parameter.
    async filter(triplets: Triplet[], refs: Reference[], limit: number = 1000) {

        let sql = "";
        let subject: Concept;

        // Add triplet filter
        if (triplets?.length > 0) {
            subject = triplets[0].getSubject();
            sql = "select t0.id as t0id, t0.idConceptStart t0idConceptStart ,#SELECT# from " + this.tables.get("triplets") + " as t0 ";

            for (let index = 1; index < triplets.length; index++) {
                let t = triplets[index];
                sql = sql.replace("#SELECT#", "t" + index + ".id as t" + index + "id ,#SELECT#");
                sql = sql + " join " + this.tables.get("triplets") + " as t" + index + " on t0.idConceptStart = " + "t" + index + ".idConceptStart";
                sql = sql + " and t" + index + ".idConceptTarget = " + t.getTarget().getId();
                sql = sql + " and t" + index + ".idConceptLink = " + t.getVerb().getId();

            }

        }
        else {
            // need atleast one triplet even if a reference is provided, 
            return null;
        }

        if (refs?.length > 0) {
            refs.forEach((r, index) => {
                // Get the triplet linked to this reference to get the table alias from previous query
                let t = r.getTripletLink();
                let i = triplets.findIndex(tp => { return t.getId() == tp.getId() });

                if (i >= 0 && t) {
                    sql = sql.replace("#SELECT#", "r" + index + ".id as r" + index + "id ,#SELECT#");

                    sql = sql + " join " + this.tables.get("references") + " as r" + index + " on t" + i + ".id = r" + index + ".linkReferenced";
                    sql = sql + " and r" + index + ".idConcept = " + r.getIdConcept().getId();
                    if (r.getValue()?.length > 0)
                        sql = sql + " and r" + index + ".value = '" + r.getValue() + "' ";
                }

            });
        }


        sql = sql +
            (triplets?.length == 1 && refs?.length == 0 ? " where " : " and ") +
            " t0.idConceptTarget = " + triplets[0].getTarget().getId();

        sql = sql.replace(",#SELECT#", " ") + " limit " + limit;

        let res: any = await this.getConnection().query(sql);
        let data: Map<Concept, Triplet[]> = new Map();

        if (res?.length > 0) {
            res.forEach((row: any) => {
                let ts: Triplet[] = [];
                let subConcept = new Concept(row.t0idConceptStart, subject.getCode(), null);
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

        return data;

    }

    async getTripletsBySubject(subject: Concept): Promise<Triplet[]> {

        let sql = "SELECT t.id as id, " +
            "c.id as subId, c.code as subCode , c.shortname as subSn, " +
            "c1.id as verbId, c1.code as verbCode , c1.shortname as verbSn, " +
            "c2.id as targetId, c2.code as targetCode , c2.shortname as targetSn from " +
            this.tables.get("triplets") + " as t join " +
            this.tables.get("concepts") + " as c on " +
            "c.id = t.idConceptStart and  t.idConceptStart = ? " +
            "join " + this.tables.get("concepts") + " as c1 on c1.id = t.idConceptLink " +
            "join " + this.tables.get("concepts") + " as c2 on c2.id = t.idConceptTarget";

        let res = await this.getConnection().query(sql, [subject.getId()]);

        let triplets: Triplet[] = [];

        if (res?.length > 0) {

            res.forEach(row => {
                triplets.push(
                    new Triplet(row.id,
                        new Concept(row.subId, row.subCode, row.subSn),
                        new Concept(row.verbId, row.verbCode, row.verbSn),
                        new Concept(row.targetId, row.targetCode, row.targetSn)
                    )
                );
            });
        }

        return triplets;

    }

    async getConceptById(conceptId: number): Promise<Concept> {

        let sql = "select id, code, shortname from " + this.tables.get("concepts") + " where id = ?";
        let res: any = await this.getConnection().query(sql, [conceptId]);

        if (res?.length > 0)
            return new Concept(res[0].id, res[0].code, res[0].shortname);

        return undefined;

    }

    async getConcept(shortname: string): Promise<Concept> {

        let sql = "select * from " + this.tables.get("concepts") + " where shortname = ?";
        let res = await this.getConnection().query(sql, shortname);

        if (res && res?.length > 0)
            return new Concept(res[0].id, res[0].code, res[0].shortname);

        return undefined;
    }

    // Get all the entity concepts for this factory, on verb contained_in_file
    async getEntityConcepts(is_a: string, lastId?: string, limit?: string): Promise<Concept[]> {

        let limitQ = "";
        let lastIdQ = "";

        if (lastId)
            lastIdQ = " and id < " + lastId + " order by id desc";
        else {
            lastIdQ = " order by id desc";
        }

        if (limit)
            limitQ = " limit " + limit;

        let sql = "select id, code, shortname from " + this.tables.get("concepts") + " where code = ? " +
            " and shortname is null " + lastIdQ + limitQ;

        let res = await this.getConnection().query(sql, Concept.ENTITY_CONCEPT_CODE_PREFIX + is_a);

        let concpets: Concept[] = [];

        if (res?.length > 0) {
            res.forEach(row => {
                concpets.push(
                    new Concept(row.id, row.code, row.shortname)
                );
            });
        }

        return concpets;

    }

    async getEntityConceptsRefs(entities: Entity[], containedInFileConcept: Concept) {

        if (entities?.length == 0) return;

        let subjs = [];
        subjs = entities.map(e => { return e.getSubject().getId() })

        let sql = "select t.id as tId, t.idConceptStart as subjectId , c.id, c.code," +
            " c.shortname, r.id as refId, r.idConcept as refCon, r.linkReferenced as refLink, " +
            " r.value as refVal from  " +
            this.tables.get("references") + "  as r " +
            " join " + this.tables.get("triplets") + " as t on t.id = r.linkReferenced" +
            " join " + this.tables.get("concepts") + " as c on r.idConcept = c.id" +
            " and t.idConceptStart in (?) " +
            " and t.idConceptLink =  ? ";

        let res: any = await this.getConnection().query(sql, [subjs, containedInFileConcept.getId()]);

        entities.forEach(e => {
            let refsRows = res.filter(r => { return r.subjectId == e.getSubject().getId() });

            if (refsRows?.length > 0) {

                let t = new Triplet(refsRows[0].tId, e.getSubject(), containedInFileConcept, null);

                let refs = refsRows.map(row => {
                    let refConcept = new Concept(row.id, row.code, row.shortname);
                    return new Reference(row.refId, refConcept, t, row.refVal);
                });

                e.setRefs(refs);
                e.getTriplets().push(t);

            }
        });

    }

    async addConcept(c: Concept, withId: boolean = false): Promise<Concept> {

        let sql = "insert ignore into " + this.tables.get("concepts") + " set code = ?, shortname = ?";

        if (withId)
            sql = "insert ignore into " + this.tables.get("concepts") + " set id = ?, code = ?, shortname = ?";

        let res = await this.getConnection().query(sql, c.getDBArrayFormat(withId));

        if (res && res?.insertId) {
            c.setId(res.insertId);
            return c;
        }

        return undefined;
    }

    async addTriplet(t: Triplet, withId: boolean = false): Promise<Triplet> {

        let sql = "";

        sql = "select id from " + this.tables.get("triplets") + " where idConceptStart = ? and idConceptLink = ? and idConceptTarget = ?";
        let res = await this.getConnection().query(sql, t.getDBArrayFormat(false));

        if (res && res?.length > 0) {
            t.setId(res[0].id);
            return t;
        }

        if (withId)
            sql = "insert into " + this.tables.get("triplets") + " set id = ?, idConceptStart = ?, idConceptLink = ?, idConceptTarget = ?, flag = ?";
        else
            sql = "insert into " + this.tables.get("triplets") + " set idConceptStart = ?, idConceptLink = ?, idConceptTarget = ?, flag = ?";

        res = await this.getConnection().query(sql, t.getDBArrayFormat(withId));

        if (res && res?.insertId) {
            t.setId(res.insertId);
            return t;
        }

        return undefined;

    }

    async upsertTriplet(t: Triplet): Promise<Triplet> {

        let sql = "select id from " + this.tables.get("triplets") + " where idConceptStart = ? and idConceptLink = ? and  idConceptTarget = ?";
        let res = await this.getConnection().query(sql, t.getDBArrayFormat(false));

        if (res && res?.length > 0) {
            // Update
            sql = "update " + this.tables.get("triplets") + " set idConceptTarget = ? where id = ?";
            await this.getConnection().query(sql, [t.getTarget().getId(), res[0].id]);
            t.setId(res[0].id);
            return t;
        }
        else {
            // Insert
            sql = "insert into " + this.tables.get("triplets") + " set idConceptStart = ?, idConceptLink = ?, idConceptTarget = ?, flag = ?";
            let resInsert = await this.getConnection().query(sql, t.getDBArrayFormat(false));

            if (resInsert && resInsert?.insertId) {
                t.setId(resInsert.insertId);
                return t;
            }

        }

        return undefined;
    }

    async addRefs(ref: Reference): Promise<Reference> {

        let sql = "select id from " + this.tables.get("references") + " where idConcept = ? and linkReferenced = ?";
        let res = await this.getConnection().query(sql, [ref.getIdConcept().getId(), ref.getTripletLink().getId()]);

        if (res && res?.length > 0) {
            ref.setId(res[0].id);
            return ref;
        }

        sql = "insert into " + this.tables.get("references") + " set idConcept = ?, linkReferenced = ?, value = ?";
        res = await this.getConnection().query(sql, ref.getDBArrayFormat(false));

        if (res && res?.insertId) {
            ref.setId(res.insertId);
            return ref;
        }

        return undefined;

    }

    async upsertRefs(ref: Reference) {

        // Selecting updated or inserted ref
        let sql = "select id from " + this.tables.get("references") + " where idConcept = ? and linkReferenced = ? ";
        let res = await this.getConnection().query(sql, [ref.getIdConcept().getId(), ref.getTripletLink().getId()]);

        if (res && res?.length > 0) {
            ref.setId(res[0].id);
            sql = "update " + this.tables.get("references") + " set value = ? where idConcept = ? and linkReferenced = ? ";
            res = await this.getConnection().query(sql, [ref.getValue(), ref.getIdConcept().getId(), ref.getTripletLink().getId()]);
            return ref;
        }

        // Upserting
        sql = "insert into " + this.tables.get("references") + " (idConcept, linkReferenced, value ) values (?,?,?)";
        let values = [...ref.getDBArrayFormat(false), ref.getValue()];
        res = await this.getConnection().query(sql, values);

        if (res && res?.insertId) {
            ref.setId(res.insertId);
            return ref;
        }

        return undefined;

    }


    async updateRefsBatchById(refs: Reference[]) {

        let caseStatemet = "";
        let ids = [];

        ids = [...new Set(refs.map(item => (item.getId())))];
        refs.forEach(ref => {
            caseStatemet = caseStatemet + " when id = " + ref.getId() + " then " + ref.getValue()
        });

        let whereStatement = " where id in (" + ids.toString() + ")";

        let sql = "update " + this.tables.get("references") + " set value = ( case " + caseStatemet + " end ) " + whereStatement;

        let res = await this.getConnection().query(sql);

        if (res) {
            return true;
        }

        return false;

    }

    async updateTripletsBatchById(triplets: Triplet[]) {

        if (triplets?.length == 0)
            return true;

        let caseStatemet = "";
        let ids = [];

        ids = [...new Set(triplets.map(item => (item.getId())))];

        triplets.forEach(t => {
            caseStatemet = caseStatemet + " when id = " + t.getId() + " then " + t.getTarget().getId()
        });

        let whereStatement = " where id in (" + ids.toString() + ")";

        let sql = "update " + this.tables.get("triplets") + " set idConceptTarget = ( case " + caseStatemet + " end ) " + whereStatement;

        let res = await this.getConnection().query(sql);

        if (res) {
            return true;
        }

        return false;

    }

    async addRefsBatch(refs: Reference[]): Promise<any> {

        let refData = [];

        refs?.forEach(ref => {
            refData.push(ref.getId(), ref.getIdConcept(), ref.getTripletLink(), ref.getValue());
        });

        let sql = "insert into " + this.tables.get("references") + " (id, idConcept, linkReferenced, value) values (?, ? ,? ,?)";

        let res = await this.getConnection().batch(sql, [refData]);

        return res;

    }

    async addBatchWithTransaction(concepts: Concept[], triplets: Triplet[], refs: Reference[], tripletWithId: boolean = false, refWithId: boolean = false) {

        let conceptsData = [];
        let tripletsData = [];
        let refsData = [];

        concepts?.forEach(concept => {
            conceptsData.push(concept.getDBArrayFormat(true));
        });
        triplets?.forEach(t => {
            let arr = t.getDBArrayFormat(tripletWithId);
            arr.forEach(a => { if (TemporaryId.isValid(a)) throw new Error("Invalid batch insert, unlinked concept found") })
            tripletsData.push(arr);
        });
        refs?.forEach(r => {
            let arr = r.getDBArrayFormat(refWithId);
            arr.forEach(a => { if (TemporaryId.isValid(a)) throw new Error("Invalid batch insert, unlinked concept found") })
            refsData.push(arr);
        });

        this.beginTransaction();

        let sql = "";
        if (conceptsData.length > 0) {
            sql = "insert into " + this.tables.get("concepts") + " (id, code, shortname) values (?, ? ,?)";
            await this.getConnection().batch(sql, conceptsData);
        }

        sql = "";
        if (tripletsData.length > 0) {
            if (tripletWithId)
                sql = "insert into " + this.tables.get("triplets") + " (id, idConceptStart, idConceptLink, idConceptTarget, flag) values (?, ?, ?, ?, ?) ";
            else
                sql = "insert ignore into " + this.tables.get("triplets") + " (idConceptStart, idConceptLink, idConceptTarget, flag) values (?, ?, ?, ?) ";
            await this.getConnection().batch(sql, tripletsData);

        }

        sql = "";
        if (refsData.length > 0) {
            let values = " (id, idConcept, linkReferenced, value) values (?, ?, ?, ?) ";
            if (!refWithId) {
                values = values = " (idConcept, linkReferenced, value) values (?, ?, ?) ";
            }
            sql = "insert ignore into " + this.tables.get("references") + values;
            await this.getConnection().batch(sql, refsData);
        }

        this.commit();

        return;

    }

    async addConceptsBatch(concepts: Concept[]): Promise<any> {


        let conceptsData = [];

        concepts?.forEach(concept => {
            conceptsData.push(concept.getDBArrayFormat(true));
        });

        let sql = "insert into " + this.tables.get("concepts") + " (id, code, shortname) values (?, ? ,?)";

        let res = await this.getConnection().batch(sql, conceptsData);

        return res;


    }

    async addTripletsBatch(triplets: Triplet[], withId: boolean = true): Promise<any> {

        let tripletsData = [];

        triplets?.forEach(t => {
            let arr = t.getDBArrayFormat(withId);
            arr.forEach(a => { if (TemporaryId.isValid(a)) throw new Error("Invalid batch insert, unlinked concept found") })
            tripletsData.push(arr);
        });

        let sql = "";

        if (withId)
            sql = "insert into " + this.tables.get("triplets") + " (id, idConceptStart, idConceptLink, idConceptTarget, flag) values (?, ?, ?, ?, ?) ";
        else
            sql = "insert ignore into " + this.tables.get("triplets") + " (idConceptStart, idConceptLink, idConceptTarget, flag) values (?, ?, ?, ?) ";

        let res = await this.getConnection().batch(sql, tripletsData);

        return res;

    }

    async addReferencesBatch(refs: Reference[], withId: boolean = false) {

        let refsData = [];

        refs?.forEach(r => {
            let arr = r.getDBArrayFormat(withId);
            arr.forEach(a => { if (TemporaryId.isValid(a)) throw new Error("Invalid batch insert, unlinked concept found") })
            refsData.push(arr);
        });

        let values = " (id, idConcept, linkReferenced, value) values (?, ?, ?, ?) ";

        if (!withId) {
            values = values = " (idConcept, linkReferenced, value) values (?, ?, ?) ";
        }


        let sql = "insert ignore into " + this.tables.get("references") + values;

        let res = await this.getConnection().batch(sql, refsData);

        return res;

    }

    async getMaxConceptId() {

        let sql = "select max(id) as id from " + this.tables.get("concepts");

        let res = await this.getConnection().query(sql);

        if (res?.length > 0)
            return res[0].id;

        return 0;

    }

    async getMaxTripletId() {

        let sql = "select max(id) as id from " + this.tables.get("triplets");

        let res = await this.getConnection().query(sql);

        if (res?.length > 0)
            return res[0].id;

        return 0;

    }

    async getMaxReferenceId() {

        let sql = "select max(id) as id from " + this.tables.get("references");

        let res = await this.getConnection().query(sql);

        if (res?.length > 0)
            return res[0].id;

        return 0;

    }

    async getMaxConceptIdFromMaxTable() {


        let sql = "select id from " + this.tables.get("maxid") + " as m where m.table = 'concept' for update ";

        let res = await this.getConnection().query(sql);

        if (res?.length > 0)
            return res[0].id;

        return 0;

    }

    async updateMaxConceptIdFromMaxTable(id: string) {


        let sql = "update " + this.tables.get("maxid") + " as m set id = ? where m.table = 'concept'";

        let res = await this.getConnection().query(sql, id);

        if (res?.length > 0)
            return res[0].id;

        return 0;

    }

    async getMaxTripletIdFromMaxTable() {


        let sql = "select id from " + this.tables.get("maxid") + " as m where m.table = 'triplets' for update ";

        let res = await this.getConnection().query(sql);

        if (res?.length > 0)
            return res[0].id;

        return 0;

    }

    async updateMaxTripletIdFromMaxTable(id: string) {


        let sql = "update " + this.tables.get("maxid") + " as m set id = ? where m.table = 'triplets'";

        let res = await this.getConnection().query(sql, id);

        if (res?.length > 0)
            return res[0].id;

        return 0;

    }

    async disbaleTrigger() {
        let sql = "set @TRIGGER_DISABLED = 1";
        return await this.getConnection().query(sql);
    }

    async enableTrigger() {
        let sql = "set @TRIGGER_DISABLED = 0";
        return await this.getConnection().query(sql);
    }
}
