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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBAdapter = void 0;
const mariaDb = __importStar(require("mariadb"));
const Concept_1 = require("./Concept");
const Reference_1 = require("./Reference");
const Sandra_1 = require("./Sandra");
const TemporaryId_1 = require("./TemporaryId");
const Triplet_1 = require("./Triplet");
const lock_status_1 = require("./enums/lock-status");
const transaction_status_1 = require("./enums/transaction-status");
const LogManager_1 = require("./loggers/LogManager");
class DBAdapter {
    constructor(config) {
        this.tables = new Map();
        this.config = config;
        this.transactionStatus = transaction_status_1.EnumTransactionStatus.Completed;
        this.tableLockStatus = lock_status_1.EnumLockStatus.Off;
        this.tables.set("concepts", this.config.env + "_SandraConcept");
        this.tables.set("references", this.config.env + "_SandraReferences");
        this.tables.set("triplets", this.config.env + "_SandraTriplets");
    }
    /**
     *
     * @returns Returns DBAdapter object, if null then new object is created.
     */
    static async getInstance() {
        if (!DBAdapter.instance) {
            DBAdapter.instance = new DBAdapter(Sandra_1.Sandra.DB_CONFIG);
            await DBAdapter.instance.connect();
        }
        return DBAdapter.instance;
    }
    /**
     *
     * @returns Returns current DBAdapter instance object.
     */
    static getInstanceObject() { return DBAdapter.instance; }
    /**
     * Connects to mySQL database with configuration set with Sandra.DB_CONFIG
     */
    async connect() {
        try {
            LogManager_1.LogManager.getInstance().info("Creating DB connection..");
            this.connection = await mariaDb.createConnection(this.config);
        }
        catch (e) {
            console.error(e);
        }
    }
    /**
     *
     * @returns Returns DB connection class object
     */
    getConnection() {
        if (this.connection)
            return this.connection;
        else
            throw Error("DB not connected");
    }
    /**
     * Closes the DB connection
     */
    async close() {
        try {
            if (this.connection) {
                await this.connection.end();
                DBAdapter.instance = null;
            }
        }
        catch (e) {
            console.error(e);
        }
    }
    /**
     * Begins DB transaction.
     */
    async beginTransaction() {
        LogManager_1.LogManager.getInstance().info("Starting transaction..");
        let sql = "Start Transaction;";
        await this.getConnection().query(sql);
        this.transactionStatus = transaction_status_1.EnumTransactionStatus.Started;
    }
    /**
     * Commits DB transactions.
     */
    async commit() {
        LogManager_1.LogManager.getInstance().info("Committing..");
        let sql = "Commit;";
        await this.getConnection().query(sql);
        this.transactionStatus = transaction_status_1.EnumTransactionStatus.Completed;
    }
    /**
     * Runs DB query to sleep for given durations.
     * @param durationInSec
     */
    async sleep(durationInSec) {
        LogManager_1.LogManager.getInstance().info("Sleep for " + durationInSec + "s");
        let sql = "select sleep(" + durationInSec + ")";
        await this.getConnection().query(sql);
    }
    /**
     * Runs lock queries on tables according to the parameter
     * @param concept Set true to lock SandraConcept table
     * @param triplet Set true to lock SandraTriplets table
     * @param ref Set true to lock SandraReferences table
     */
    async lockTables(concept = false, triplet = false, ref = false) {
        let tables = [];
        if (concept)
            tables.push(this.tables.get("concepts") + " WRITE");
        if (triplet)
            tables.push(this.tables.get("triplets") + " WRITE");
        if (ref)
            tables.push(this.tables.get("references") + " WRITE");
        if (tables.length > 0) {
            LogManager_1.LogManager.getInstance().info("Unlocking tables.." + tables.toString());
            let sql = "LOCK TABLES " + tables.toString() + ";";
            await this.getConnection().query(sql);
        }
    }
    /**
     * Runs unlock query to unlock tables
     */
    async unlockTable() {
        LogManager_1.LogManager.getInstance().info("Unlocking tables..");
        let sql = "UNLOCK TABLES";
        await this.getConnection().query(sql);
    }
    /**
     * Queries database for references attached to given triplet and if reference concept is provided
     * then only those reference concepts are selected
     * @param t
     * @param refConcept
     * @returns Returns Reference class object of given triplet.
     */
    async getReferenceByTriplet(t, refConcept = null) {
        let refCon = "";
        if (refConcept) {
            refCon = " and r.idConcept in (?)";
        }
        let sql = "select r.id, c.id as cId, c.code, c.shortname, r.value from " + this.tables.get("references") + " as r " +
            " join " + this.tables.get("concepts") + " as c on r.idConcept = c.id and r.linkReferenced = ?" + refCon;
        let v = [t.getId()];
        if (refCon)
            v = [...v, refConcept.getId()];
        let res = await this.getConnection().query(sql, v);
        let refs = [];
        if ((res === null || res === void 0 ? void 0 : res.length) > 0) {
            res.forEach(row => {
                refs.push(new Reference_1.Reference(row.id, new Concept_1.Concept(row.cId, row.code, row.shortname), t, row.value));
            });
        }
        return refs;
    }
    /**
     * Query database for references attached to given triplets array
     * @param triplets
     * @returns Returns a promis of References array for given triplets
     */
    async getReferenceByTriplets(triplets) {
        let sql = "select r.id,  r.linkReferenced as tripletId, c.id as cId, c.code, c.shortname, r.value from " + this.tables.get("references") + " as r " +
            " join " + this.tables.get("concepts") + " as c on r.idConcept = c.id and r.linkReferenced in (?)";
        let v = [];
        triplets.map(t => { v = [...v, t.getId()]; });
        let res = await this.getConnection().query(sql, [v]);
        let refs = [];
        if ((res === null || res === void 0 ? void 0 : res.length) > 0) {
            res.forEach(row => {
                refs.push(new Reference_1.Reference(row.id, new Concept_1.Concept(row.cId, row.code, row.shortname), new Triplet_1.Triplet(row.tripletId, null, null, null), row.value));
            });
        }
        return refs;
    }
    /**
     *  Get the triplet attached with given verb and target linked to given reference
     */
    async getEntityTriplet(verb, target, ref, limit = 1000) {
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
        let triplets = [];
        if ((res === null || res === void 0 ? void 0 : res.length) > 0) {
            res.forEach(row => {
                triplets.push(new Triplet_1.Triplet(row.id, new Concept_1.Concept(row.subjectId, row.subjectCode, row.subjectShortname), verb, target));
            });
        }
        return triplets;
    }
    /**
     * Queries database for triplets with given subjects and verb concepts. Loads verb concept data also if
     * loadVerbData is set to true.
     * @param subjects
     * @param verbs
     * @param loadVerbData
     * @returns Returns array of triplets for given subject and verb
     */
    async getTriplets(subjects, verbs = null, loadVerbData = false) {
        let subConcept = [];
        let verbConcept = [];
        subjects.forEach((subject) => {
            subConcept.push(subject.getId());
        });
        verbs === null || verbs === void 0 ? void 0 : verbs.forEach((verb) => {
            verbConcept.push(verb.getId());
        });
        let sql = "select c.id as cId, c.shortname as cSN, c.code as cCode , t.id as id, t.idConceptStart as subId, t.idConceptLink as verbId, t.idConceptTarget as targetId #VERB_SELECT# from "
            + this.tables.get("triplets")
            + " as t join " + this.tables.get("concepts") + " as c on c.id = t.idConceptTarget "
            + " and t.idConceptStart in (?)";
        if (loadVerbData) {
            sql = sql.replace("#VERB_SELECT#", " , c1.code as verbCode, c1.shortname as verbSn ");
        }
        else
            sql = sql.replace("#VERB_SELECT#", " , null as verbCode, null as verbSn ");
        let res;
        if ((verbs === null || verbs === void 0 ? void 0 : verbs.length) > 0) {
            sql = sql + " and t.idConceptLink in (?)";
            if (loadVerbData) {
                sql = sql + " join " + this.tables.get("concepts") + " as c1 on c1.id = t.idConceptLink ";
            }
            res = await this.getConnection().query(sql, [subConcept, verbConcept]);
        }
        else {
            if (loadVerbData) {
                sql = sql + " join " + this.tables.get("concepts") + " as c1 on c1.id = t.idConceptLink ";
            }
            res = await this.getConnection().query(sql, [subConcept]);
        }
        ;
        let triplets = [];
        if ((res === null || res === void 0 ? void 0 : res.length) > 0) {
            res.forEach((row) => {
                triplets.push(new Triplet_1.Triplet(row.id, new Concept_1.Concept(row.subId, null, null), new Concept_1.Concept(row.verbId, row.verbCode, row.verbSn), new Concept_1.Concept(row.cId, row.cCode, row.cSN)));
            });
        }
        return triplets;
    }
    /**
     * Queries database for give verb, target and refs values.
     * @param verb
     * @param target
     * @param refsValuesToSearch
     * @param refConcept
     * @returns Returns map of reference value and corresponding Concept
     */
    async getEntityConceptsByRefs(verb, target, refsValuesToSearch, refConcept) {
        let sql = "select  c.id, c.code, c.shortname, r.value from " +
            this.tables.get("references") + "  as r " +
            " join " + this.tables.get("triplets") + " as t on t.id = r.linkReferenced" +
            " join " + this.tables.get("concepts") + " as c on t.idConceptStart = c.id" +
            " and r.value in ( ? ) " +
            " and r.idConcept = ? " +
            " and t.idConceptLink =  ? " +
            " and t.idConceptTarget = ? ";
        let res = await this.getConnection().query(sql, [refsValuesToSearch, refConcept.getId(), verb.getId(), target.getId()]);
        let map = new Map();
        if ((res === null || res === void 0 ? void 0 : res.length) > 0) {
            res.forEach(row => {
                map.set(row.value.toString(), new Concept_1.Concept(row.id, row.code, row.shortname));
            });
        }
        return map;
    }
    /**
     * Queries database to get all the triplets of given triplet subject.
     * @param t
     * @param limit
     * @returns Map of subject concept and triplet array
     */
    async getEntitiesByTriplet(t, limit = 1000) {
        let sql = "";
        let subject = t[0].getSubject();
        let selectTripletId = [];
        if (t.length > 1) {
            selectTripletId.push("t0.id as t0id");
            sql = "select t0.idConceptStart as idConceptStart , #ID# from " + this.tables.get("triplets") + " as t0";
            for (let i = 1; i < t.length; i++) {
                let table = "t" + (i).toString();
                selectTripletId.push(table + ".id as " + table + "id");
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
        let res = await this.getConnection().query(sql);
        let data = new Map();
        if ((res === null || res === void 0 ? void 0 : res.length) > 0) {
            res.forEach(row => {
                let triplets = [];
                for (let i = 0; i < t.length; i++) {
                    triplets.push(new Triplet_1.Triplet(row["t" + i + "id"], subject, t[i].getVerb(), t[i].getTarget()));
                }
                data.set(new Concept_1.Concept(row.idConceptStart, subject.getCode(), null), triplets);
            });
        }
        return data;
    }
    /**
     * Filter by triplets and refernce, if a refrence is added then reference should have
     * tripletLink set and this triplet should be provided with triplets parameter.
     * @param triplets
     * @param refs
     * @param limit
     * @returns
     */
    async filter(triplets, refs, limit = 1000) {
        let sql = "";
        let subject;
        // Add triplet filter
        if ((triplets === null || triplets === void 0 ? void 0 : triplets.length) > 0) {
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
        if ((refs === null || refs === void 0 ? void 0 : refs.length) > 0) {
            refs.forEach((r, index) => {
                var _a;
                // Get the triplet linked to this reference to get the table alias from previous query
                let t = r.getTripletLink();
                let i = triplets.findIndex(tp => { return t.getId() == tp.getId(); });
                if (i >= 0 && t) {
                    sql = sql.replace("#SELECT#", "r" + index + ".id as r" + index + "id ,#SELECT#");
                    sql = sql + " join " + this.tables.get("references") + " as r" + index + " on t" + i + ".id = r" + index + ".linkReferenced";
                    sql = sql + " and r" + index + ".idConcept = " + r.getIdConcept().getId();
                    if (((_a = r.getValue()) === null || _a === void 0 ? void 0 : _a.length) > 0)
                        sql = sql + " and r" + index + ".value = '" + r.getValue() + "' ";
                }
            });
        }
        sql = sql +
            ((triplets === null || triplets === void 0 ? void 0 : triplets.length) == 1 && (refs === null || refs === void 0 ? void 0 : refs.length) == 0 ? " where " : " and ") +
            " t0.idConceptTarget = " + triplets[0].getTarget().getId();
        sql = sql.replace(",#SELECT#", " ") + " limit " + limit;
        let res = await this.getConnection().query(sql);
        let data = new Map();
        if ((res === null || res === void 0 ? void 0 : res.length) > 0) {
            res.forEach((row) => {
                let ts = [];
                let subConcept = new Concept_1.Concept(row.t0idConceptStart, subject.getCode(), null);
                for (let i = 0; i < triplets.length; i++) {
                    let t = new Triplet_1.Triplet(row["t" + i + "id"], subConcept, triplets[i].getVerb(), triplets[i].getTarget());
                    t.setJoinedEntity(triplets[i].getJoinedEntity());
                    ts.push(t);
                }
                data.set(subConcept, ts);
            });
        }
        return data;
    }
    /**
     * Queries database for  all the triplets with given subject id
     * @param subject
     * @returns Returns tripets array with given subject id
     */
    async getTripletsBySubject(subject) {
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
        let triplets = [];
        if ((res === null || res === void 0 ? void 0 : res.length) > 0) {
            res.forEach(row => {
                triplets.push(new Triplet_1.Triplet(row.id, new Concept_1.Concept(row.subId, row.subCode, row.subSn), new Concept_1.Concept(row.verbId, row.verbCode, row.verbSn), new Concept_1.Concept(row.targetId, row.targetCode, row.targetSn)));
            });
        }
        return triplets;
    }
    /**
     * Queries database for give concept id from concepts table
     * @param conceptId
     * @returns Returns promise of Concept with given id
     */
    async getConceptById(conceptId) {
        let sql = "select id, code, shortname from " + this.tables.get("concepts") + " where id = ?";
        let res = await this.getConnection().query(sql, [conceptId]);
        if ((res === null || res === void 0 ? void 0 : res.length) > 0)
            return new Concept_1.Concept(res[0].id, res[0].code, res[0].shortname);
        return undefined;
    }
    /**
     * Queries database concepts table for given shortname
     * @param shortname
     * @returns Returns promise of concept with given shortname
     */
    async getConcept(shortname) {
        let sql = "select * from " + this.tables.get("concepts") + " where shortname = ?";
        let res = await this.getConnection().query(sql, shortname);
        if (res && (res === null || res === void 0 ? void 0 : res.length) > 0)
            return new Concept_1.Concept(res[0].id, res[0].code, res[0].shortname);
        return undefined;
    }
    /**
     * Queries the database for concpets with given is_a and shortname null, entity concepts
     * @param is_a - checks for code in concepts table
     * @param lastId - Get data with id less than lastId
     * @param limit - Limit records
     * @returns Concepts array
     */
    async getEntityConcepts(is_a, lastId, limit) {
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
        let res = await this.getConnection().query(sql, Concept_1.Concept.ENTITY_CONCEPT_CODE_PREFIX + is_a);
        let concpets = [];
        if ((res === null || res === void 0 ? void 0 : res.length) > 0) {
            res.forEach(row => {
                concpets.push(new Concept_1.Concept(row.id, row.code, row.shortname));
            });
        }
        return concpets;
    }
    /**
     * Updates given entities references from the database
     * @param entities
     * @param containedInFileConcept
     * @returns
     */
    async getEntityConceptsRefs(entities, containedInFileConcept) {
        if ((entities === null || entities === void 0 ? void 0 : entities.length) == 0)
            return;
        let subjs = [];
        subjs = entities.map(e => { return e.getSubject().getId(); });
        let sql = "select t.id as tId, t.idConceptStart as subjectId , c.id, c.code," +
            " c.shortname, r.id as refId, r.idConcept as refCon, r.linkReferenced as refLink, " +
            " r.value as refVal from  " +
            this.tables.get("references") + "  as r " +
            " join " + this.tables.get("triplets") + " as t on t.id = r.linkReferenced" +
            " join " + this.tables.get("concepts") + " as c on r.idConcept = c.id" +
            " and t.idConceptStart in (?) " +
            " and t.idConceptLink =  ? ";
        let res = await this.getConnection().query(sql, [subjs, containedInFileConcept.getId()]);
        entities.forEach(e => {
            let refsRows = res.filter(r => { return r.subjectId == e.getSubject().getId(); });
            if ((refsRows === null || refsRows === void 0 ? void 0 : refsRows.length) > 0) {
                let t = new Triplet_1.Triplet(refsRows[0].tId, e.getSubject(), containedInFileConcept, null);
                let refs = refsRows.map(row => {
                    let refConcept = new Concept_1.Concept(row.id, row.code, row.shortname);
                    return new Reference_1.Reference(row.refId, refConcept, t, row.refVal);
                });
                e.setRefs(refs);
                e.getTriplets().push(t);
            }
        });
    }
    /**
     * Adds given concept, if found then igores it.
     * @param c
     * @param withId
     * @returns Returns added concept else null
     */
    async addConcept(c, withId = false) {
        let sql = "insert ignore into " + this.tables.get("concepts") + " set code = ?, shortname = ?";
        if (withId)
            sql = "insert ignore into " + this.tables.get("concepts") + " set id = ?, code = ?, shortname = ?";
        let res = await this.getConnection().query(sql, c.getDBArrayFormat(withId));
        if (res && (res === null || res === void 0 ? void 0 : res.insertId)) {
            c.setId(res.insertId);
            return c;
        }
        return undefined;
    }
    /**
     * Checks for given triplet in database, if not found then adds it.
     * @param t
     * @param withId
     * @returns Returns added or selected triplet
     */
    async addTriplet(t, withId = false) {
        let sql = "";
        sql = "select id from " + this.tables.get("triplets") + " where idConceptStart = ? and idConceptLink = ? and idConceptTarget = ?";
        let res = await this.getConnection().query(sql, t.getDBArrayFormat(false));
        if (res && (res === null || res === void 0 ? void 0 : res.length) > 0) {
            t.setId(res[0].id);
            return t;
        }
        if (withId)
            sql = "insert into " + this.tables.get("triplets") + " set id = ?, idConceptStart = ?, idConceptLink = ?, idConceptTarget = ?, flag = ?";
        else
            sql = "insert into " + this.tables.get("triplets") + " set idConceptStart = ?, idConceptLink = ?, idConceptTarget = ?, flag = ?";
        res = await this.getConnection().query(sql, t.getDBArrayFormat(withId));
        if (res && (res === null || res === void 0 ? void 0 : res.insertId)) {
            t.setId(res.insertId);
            return t;
        }
        return undefined;
    }
    /**
     * Checks for given triplet in database, if not found then adds it else updates it.
     * @param t
     * @returns Returns upserted or selected triplet
     */
    async upsertTriplet(t) {
        let sql = "select id from " + this.tables.get("triplets") + " where idConceptStart = ? and idConceptLink = ?";
        let res = await this.getConnection().query(sql, [t.getSubject().getId(), t.getVerb().getId()]);
        if (res && (res === null || res === void 0 ? void 0 : res.length) > 0) {
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
            if (resInsert && (resInsert === null || resInsert === void 0 ? void 0 : resInsert.insertId)) {
                t.setId(resInsert.insertId);
                return t;
            }
        }
        return undefined;
    }
    /**
     * Checks for given reference in database if not found then adds it.
     * @param ref
     * @returns Returns added or selected Reference
     */
    async addRefs(ref) {
        let sql = "select id from " + this.tables.get("references") + " where idConcept = ? and linkReferenced = ?";
        let res = await this.getConnection().query(sql, [ref.getIdConcept().getId(), ref.getTripletLink().getId()]);
        if (res && (res === null || res === void 0 ? void 0 : res.length) > 0) {
            ref.setId(res[0].id);
            return ref;
        }
        sql = "insert into " + this.tables.get("references") + " set idConcept = ?, linkReferenced = ?, value = ?";
        res = await this.getConnection().query(sql, ref.getDBArrayFormat(false));
        if (res && (res === null || res === void 0 ? void 0 : res.insertId)) {
            ref.setId(res.insertId);
            return ref;
        }
        return undefined;
    }
    /**
     * Checks for given reference in database if not found then adds it and if found then updates it.
     * @param ref
     * @returns Returns upserted or selected Reference
     */
    async upsertRefs(ref) {
        // Selecting updated or inserted ref
        let sql = "select id from " + this.tables.get("references") + " where idConcept = ? and linkReferenced = ? ";
        let res = await this.getConnection().query(sql, [ref.getIdConcept().getId(), ref.getTripletLink().getId()]);
        if (res && (res === null || res === void 0 ? void 0 : res.length) > 0) {
            ref.setId(res[0].id);
            sql = "update " + this.tables.get("references") + " set value = ? where idConcept = ? and linkReferenced = ? ";
            res = await this.getConnection().query(sql, [ref.getValue(), ref.getIdConcept().getId(), ref.getTripletLink().getId()]);
            return ref;
        }
        // Upserting
        sql = "insert into " + this.tables.get("references") + " (idConcept, linkReferenced, value ) values (?,?,?)";
        let values = [...ref.getDBArrayFormat(false), ref.getValue()];
        res = await this.getConnection().query(sql, values);
        if (res && (res === null || res === void 0 ? void 0 : res.insertId)) {
            ref.setId(res.insertId);
            return ref;
        }
        return undefined;
    }
    /**
     * Updates given references in database by check the references ids of given references array. Query by batch.
     * @param refs
     * @returns
     */
    async updateRefsBatchById(refs) {
        let caseStatemet = "";
        let ids = [];
        ids = [...new Set(refs.map(item => (item.getId())))];
        refs.forEach(ref => {
            caseStatemet = caseStatemet + " when id = " + ref.getId() + " then " + ref.getValue();
        });
        let whereStatement = " where id in (" + ids.toString() + ")";
        let sql = "update " + this.tables.get("references") + " set value = ( case " + caseStatemet + " end ) " + whereStatement;
        let res = await this.getConnection().query(sql);
        if (res) {
            return true;
        }
        return false;
    }
    /**
     * Updates given triplets in database by checking the triplet ids. Make sure that triplet objects
     * in parameter are loaded with ids. Uses batch query.
     * @param triplets
     * @returns
     */
    async updateTripletsBatchById(triplets) {
        if ((triplets === null || triplets === void 0 ? void 0 : triplets.length) == 0)
            return true;
        let caseStatemet = "";
        let ids = [];
        ids = [...new Set(triplets.map(item => (item.getId())))];
        triplets.forEach(t => {
            caseStatemet = caseStatemet + " when id = " + t.getId() + " then " + t.getTarget().getId();
        });
        let whereStatement = " where id in (" + ids.toString() + ")";
        let sql = "update " + this.tables.get("triplets") + " set idConceptTarget = ( case " + caseStatemet + " end ) " + whereStatement;
        let res = await this.getConnection().query(sql);
        if (res) {
            return true;
        }
        return false;
    }
    //TODO - Unkown/Unused function 
    async addRefsBatch(refs) {
        let refData = [];
        refs === null || refs === void 0 ? void 0 : refs.forEach(ref => {
            refData.push(ref.getId(), ref.getIdConcept(), ref.getTripletLink(), ref.getValue());
        });
        let sql = "insert into " + this.tables.get("references") + " (id, idConcept, linkReferenced, value) values (?, ? ,? ,?)";
        let res = await this.getConnection().batch(sql, [refData]);
        return res;
    }
    /**
     * Inserts given concepts in database as a batch.
     * @param concepts
     * @returns
     */
    async addConceptsBatch(concepts) {
        let conceptsData = [];
        concepts === null || concepts === void 0 ? void 0 : concepts.forEach(concept => {
            conceptsData.push(concept.getDBArrayFormat(true));
        });
        let sql = "insert into " + this.tables.get("concepts") + " (id, code, shortname) values (?, ? ,?)";
        let res = await this.getConnection().batch(sql, conceptsData);
        return res;
    }
    /**
     * Inserts given triplets into the database as a batch, includes triplet ids in batch if
     * withId is set to true
     * @param triplets
     * @param withId
     * @returns
     */
    async addTripletsBatch(triplets, withId = true) {
        let tripletsData = [];
        triplets === null || triplets === void 0 ? void 0 : triplets.forEach(t => {
            let arr = t.getDBArrayFormat(withId);
            arr.forEach(a => { if (TemporaryId_1.TemporaryId.isValid(a))
                throw new Error("Invalid batch insert, unlinked concept found"); });
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
    /**
     * Inserts given refrences into database as a batch, creates auto ids if with withId is set to false otherwise
     * it will run queries to include id also.
     * @param refs
     * @param withId
     * @returns
     */
    async addReferencesBatch(refs, withId = false) {
        let refsData = [];
        refs === null || refs === void 0 ? void 0 : refs.forEach(r => {
            let arr = r.getDBArrayFormat(withId);
            arr.forEach(a => { if (TemporaryId_1.TemporaryId.isValid(a))
                throw new Error("Invalid batch insert, unlinked concept found"); });
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
    /**
     *
     * @returns Returns max id of SandraConcept table
     */
    async getMaxConceptId() {
        let sql = "select max(id) as id from " + this.tables.get("concepts");
        let res = await this.getConnection().query(sql);
        if ((res === null || res === void 0 ? void 0 : res.length) > 0)
            return res[0].id;
        return 0;
    }
    /**
     *
     * @returns Returns max if of SandraTriplets table
     */
    async getMaxTripletId() {
        let sql = "select max(id) as id from " + this.tables.get("triplets");
        let res = await this.getConnection().query(sql);
        if ((res === null || res === void 0 ? void 0 : res.length) > 0)
            return res[0].id;
        return 0;
    }
    /**
     *
     * @returns Returns max id from SandraReferences table
     */
    async getMaxReferenceId() {
        let sql = "select max(id) as id from " + this.tables.get("references");
        let res = await this.getConnection().query(sql);
        if ((res === null || res === void 0 ? void 0 : res.length) > 0)
            return res[0].id;
        return 0;
    }
    //////////// BENCHMARK TEST FUNCTION - START /////////////////////
    async addBatchWithTransaction(concepts, triplets, refs, tripletWithId = false, refWithId = false) {
        let conceptsData = [];
        let tripletsData = [];
        let refsData = [];
        concepts === null || concepts === void 0 ? void 0 : concepts.forEach(concept => {
            conceptsData.push(concept.getDBArrayFormat(true));
        });
        triplets === null || triplets === void 0 ? void 0 : triplets.forEach(t => {
            let arr = t.getDBArrayFormat(tripletWithId);
            arr.forEach(a => { if (TemporaryId_1.TemporaryId.isValid(a))
                throw new Error("Invalid batch insert, unlinked concept found"); });
            tripletsData.push(arr);
        });
        refs === null || refs === void 0 ? void 0 : refs.forEach(r => {
            let arr = r.getDBArrayFormat(refWithId);
            arr.forEach(a => { if (TemporaryId_1.TemporaryId.isValid(a))
                throw new Error("Invalid batch insert, unlinked concept found"); });
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
    //////////// BENCHMARK TEST FUNCTION - END /////////////////////
    //////////// BENCHMARK TEST FUNCTION WITH MAXID TABLE - START /////////////////////
    async getMaxConceptIdFromMaxTable() {
        let sql = "select id from " + this.tables.get("maxid") + " as m where m.table = 'concept' for update ";
        let res = await this.getConnection().query(sql);
        if ((res === null || res === void 0 ? void 0 : res.length) > 0)
            return res[0].id;
        return 0;
    }
    async updateMaxConceptIdFromMaxTable(id) {
        let sql = "update " + this.tables.get("maxid") + " as m set id = ? where m.table = 'concept'";
        let res = await this.getConnection().query(sql, id);
        if ((res === null || res === void 0 ? void 0 : res.length) > 0)
            return res[0].id;
        return 0;
    }
    async getMaxTripletIdFromMaxTable() {
        let sql = "select id from " + this.tables.get("maxid") + " as m where m.table = 'triplets' for update ";
        let res = await this.getConnection().query(sql);
        if ((res === null || res === void 0 ? void 0 : res.length) > 0)
            return res[0].id;
        return 0;
    }
    async updateMaxTripletIdFromMaxTable(id) {
        let sql = "update " + this.tables.get("maxid") + " as m set id = ? where m.table = 'triplets'";
        let res = await this.getConnection().query(sql, id);
        if ((res === null || res === void 0 ? void 0 : res.length) > 0)
            return res[0].id;
        return 0;
    }
}
exports.DBAdapter = DBAdapter;
//# sourceMappingURL=DBAdapter.js.map