import * as mariaDb from "mariadb";
import { Connection } from "mariadb";
import { Concept } from "./Concept";
import { EnumLockStatus } from "./enums/lock-status";
import { EnumTransactionStatus } from "./enums/transaction-status";
import { IDBConfig } from "./interfaces/IDBconfig";
import { LogManager } from "./loggers/LogManager";
import { Reference } from "./Reference";
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

    }

    public static async getInstance(): Promise<DBAdapter> {

        if (!DBAdapter.instance) {
            DBAdapter.instance = new DBAdapter(Utils.getDBConfig());
            await DBAdapter.instance.connect();
        }


        return DBAdapter.instance;
    }

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
            if (this.connection)
                await this.connection.end();
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

    async getReferenceByTriplet(t: Triplet): Promise<Reference[]> {

        let sql = "select r.id, c.id as cId, c.code, c.shortname, r.value from " + this.tables.get("references") + " as r " +
            " join " + this.tables.get("concepts") + " as c on r.idConcept = c.id and r.linkReferenced = ?";

        let res: any = await this.getConnection().query(sql,
            [t.getId()]);

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

    /**
     *  Get the triplet attached with given verb and target linked to given reference
     */
    async getEntityTriplet(verb: Concept, target: Concept, ref: Reference): Promise<Triplet[]> {

        let sql = "select t.id, c.id as subjectId, c.code as subjectCode, c.shortname as subjectShortname, t.idConceptLink as verb, t.idConceptTarget as target from " + this.tables.get("triplets") + " as t join  " + this.tables.get("references") + " as r" +
            " on t.id = r.linkReferenced and t.idConceptLink = ? and t.idConceptTarget = ? and r.value = ? and" +
            " r.idConcept = ? join " + this.tables.get("concepts") + " as c on t.idConceptStart = c.id";

        let res: any = await this.getConnection().query(sql, [verb.getId(), target.getId(), ref.getValue(), ref.getIdConcept().getId()]);
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

    async getEntityConceptsByRefs(verb: Concept, target: Concept, refsValuesToSearch: string[], refConcept: Concept): Promise<Map<string, Concept>> {

        let refs = refsValuesToSearch.map(function (id) { return "'" + id + "'"; }).join(",");

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


        let sql = "insert ignore into " + this.tables.get("triplets") + " set idConceptStart = ?, idConceptLink = ?, idConceptTarget = ?";

        if (withId)
            sql = "insert ignore into " + this.tables.get("triplets") + " set id = ?, idConceptStart = ?, idConceptLink = ?, idConceptTarget = ?";


        let res = await this.getConnection().query(sql, t.getDBArrayFormat(withId));

        if (res && res?.insertId) {
            t.setId(res.insertId);
            return t;
        }

        return undefined;
    }

    async addRefs(ref: Reference): Promise<Reference> {

        let sql = "insert ignore into " + this.tables.get("references") + " set idConcept = ?, linkReferenced = ?, value = ?";
        let res = await this.getConnection().query(sql, ref.getDBArrayFormat(false));

        if (res && res?.insertId) {
            ref.setId(res.insertId);
            return ref;
        }

        return undefined;
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

    async addConceptsBatch(concepts: Concept[]): Promise<any> {


        let conceptsData = [];

        concepts?.forEach(concept => {
            conceptsData.push(concept.getDBArrayFormat(true));
        });

        let sql = "insert into " + this.tables.get("concepts") + " (id, code, shortname) values (?, ? ,?)";

        let res = await this.getConnection().batch(sql, conceptsData);

        return res;

    }

    async addTripletsBatch(triplets: Triplet[]): Promise<any> {

        let tripletsData = [];

        triplets?.forEach(t => {
            let arr = t.getDBArrayFormat(true);
            arr.forEach(a => { if (a == "-1") throw new Error("Invalid batch insert, unlinked concept found") })
            tripletsData.push(arr);
        });

        let sql = "insert into " + this.tables.get("triplets") + " (id, idConceptStart, idConceptLink, idConceptTarget) values (?, ?, ?, ?) ";

        let res = await this.getConnection().batch(sql, tripletsData);

        return res;

    }

    async addReferencesBatch(refs: Reference[], withId: boolean = false) {

        let refsData = [];

        refs?.forEach(r => {
            let arr = r.getDBArrayFormat(withId);
            if (withId)
                arr.forEach(a => { if (a == "-1") throw new Error("Invalid batch insert, unlinked concept found") })
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

}
