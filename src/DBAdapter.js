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
const lock_status_1 = require("./enums/lock-status");
const transaction_status_1 = require("./enums/transaction-status");
const LogManager_1 = require("./loggers/LogManager");
const Reference_1 = require("./Reference");
const Triplet_1 = require("./Triplet");
const Utils_1 = require("./Utils");
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
    static async getInstance() {
        if (!DBAdapter.instance) {
            DBAdapter.instance = new DBAdapter(Utils_1.Utils.getDBConfig());
            await DBAdapter.instance.connect();
        }
        return DBAdapter.instance;
    }
    async connect() {
        try {
            LogManager_1.LogManager.getInstance().info("Creating DB connection..");
            this.connection = await mariaDb.createConnection(this.config);
        }
        catch (e) {
            console.error(e);
        }
    }
    getConnection() {
        if (this.connection)
            return this.connection;
        else
            throw Error("DB not connected");
    }
    async close() {
        try {
            if (this.connection)
                await this.connection.end();
        }
        catch (e) {
            console.error(e);
        }
    }
    async beginTransaction() {
        LogManager_1.LogManager.getInstance().info("Starting transaction..");
        let sql = "Start Transaction;";
        await this.getConnection().query(sql);
        this.transactionStatus = transaction_status_1.EnumTransactionStatus.Started;
    }
    async commit() {
        LogManager_1.LogManager.getInstance().info("Committing..");
        let sql = "Commit;";
        await this.getConnection().query(sql);
        this.transactionStatus = transaction_status_1.EnumTransactionStatus.Completed;
    }
    async sleep(durationInSec) {
        LogManager_1.LogManager.getInstance().info("Sleep for " + durationInSec + "s");
        let sql = "select sleep(" + durationInSec + ")";
        await this.getConnection().query(sql);
    }
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
    async unlockTable() {
        LogManager_1.LogManager.getInstance().info("Unlocking tables..");
        let sql = "UNLOCK TABLES";
        await this.getConnection().query(sql);
    }
    async getReferenceByTriplet(t) {
        let sql = "select r.id, c.id as cId, c.code, c.shortname, r.value from " + this.tables.get("references") + " as r " +
            " join " + this.tables.get("concepts") + " as c on r.idConcept = c.id and r.linkReferenced = ?";
        let res = await this.getConnection().query(sql, [t.getId()]);
        let refs = [];
        if ((res === null || res === void 0 ? void 0 : res.length) > 0) {
            res.forEach(row => {
                refs.push(new Reference_1.Reference(row.id, new Concept_1.Concept(row.cId, row.code, row.shortname), t, row.value));
            });
        }
        return refs;
    }
    /**
     *  Get the triplet attached with given verb and target linked to given reference
     */
    async getEntityTriplet(verb, target, ref) {
        let sql = "select t.id, c.id as subjectId, c.code as subjectCode, c.shortname as subjectShortname, t.idConceptLink as verb, t.idConceptTarget as target from " + this.tables.get("triplets") + " as t join  " + this.tables.get("references") + " as r" +
            " on t.id = r.linkReferenced and t.idConceptLink = ? and t.idConceptTarget = ? and r.value = ? and" +
            " r.idConcept = ? join " + this.tables.get("concepts") + " as c on t.idConceptStart = c.id";
        let res = await this.getConnection().query(sql, [verb.getId(), target.getId(), ref.getValue(), ref.getIdConcept().getId()]);
        let triplets = [];
        if ((res === null || res === void 0 ? void 0 : res.length) > 0) {
            res.forEach(row => {
                triplets.push(new Triplet_1.Triplet(row.id, new Concept_1.Concept(row.subjectId, row.subjectCode, row.subjectShortname), verb, target));
            });
        }
        return triplets;
    }
    async getEntityConceptsByRefs(verb, target, refsValuesToSearch, refConcept) {
        let refs = refsValuesToSearch.map(function (id) { return "'" + id + "'"; }).join(",");
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
    async getConceptById(conceptId) {
        let sql = "select id, code, shortname from " + this.tables.get("concepts") + " where id = ?";
        let res = await this.getConnection().query(sql, [conceptId]);
        if ((res === null || res === void 0 ? void 0 : res.length) > 0)
            return new Concept_1.Concept(res[0].id, res[0].code, res[0].shortname);
        return undefined;
    }
    async getConcept(shortname) {
        let sql = "select * from " + this.tables.get("concepts") + " where shortname = ?";
        let res = await this.getConnection().query(sql, shortname);
        if (res && (res === null || res === void 0 ? void 0 : res.length) > 0)
            return new Concept_1.Concept(res[0].id, res[0].code, res[0].shortname);
        return undefined;
    }
    // Get all the entity concepts for this factory, on verb contained_in_file
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
    async addConcept(c, withId = false) {
        let values = " set code = ?, shortname = ?";
        if (withId)
            values = values + ", id = ?";
        let sql = "insert ignore into " + this.tables.get("concepts") + values;
        let res = await this.getConnection().query(sql, c.getDBArrayFormat(withId));
        if (res && (res === null || res === void 0 ? void 0 : res.insertId)) {
            c.setId(res.insertId);
            return c;
        }
        return undefined;
    }
    async addTriplet(t, withId = false) {
        let values = " set idConceptStart = ?, idConceptLink = ?, idConceptTarget = ?";
        if (withId)
            values = values + ", id = ?";
        let sql = "insert ignore into " + this.tables.get("triplets") + values;
        let res = await this.getConnection().query(sql, t.getDBArrayFormat(withId));
        if (res && (res === null || res === void 0 ? void 0 : res.insertId)) {
            t.setId(res.insertId);
            return t;
        }
        return undefined;
    }
    async addRefs(ref) {
        let sql = "insert ignore into " + this.tables.get("references") + " set idConcept = ?, linkReferenced = ?, value = ?";
        let res = await this.getConnection().query(sql, ref.getDBArrayFormat(false));
        if (res && (res === null || res === void 0 ? void 0 : res.insertId)) {
            ref.setId(res.insertId);
            return ref;
        }
        return undefined;
    }
    async addRefsBatch(refs) {
        let refData = [];
        refs === null || refs === void 0 ? void 0 : refs.forEach(ref => {
            refData.push(ref.getId(), ref.getIdConcept(), ref.getTripletLink(), ref.getValue());
        });
        let sql = "insert into " + this.tables.get("references") + " (id, idConcept, linkReferenced, value) values (?, ? ,? ,?)";
        let res = await this.getConnection().batch(sql, [refData]);
        return res;
    }
    async addConceptsBatch(concepts) {
        let conceptsData = [];
        concepts === null || concepts === void 0 ? void 0 : concepts.forEach(concept => {
            conceptsData.push(concept.getDBArrayFormat(true));
        });
        let sql = "insert into " + this.tables.get("concepts") + " (id, code, shortname) values (?, ? ,?)";
        let res = await this.getConnection().batch(sql, conceptsData);
        return res;
    }
    async addTripletsBatch(triplets) {
        let tripletsData = [];
        triplets === null || triplets === void 0 ? void 0 : triplets.forEach(t => {
            let arr = t.getDBArrayFormat(true);
            arr.forEach(a => { if (a == "-1")
                throw new Error("Invalid batch insert, unlinked concept found"); });
            tripletsData.push(arr);
        });
        let sql = "insert into " + this.tables.get("triplets") + " (id, idConceptStart, idConceptLink, idConceptTarget) values (?, ?, ?, ?) ";
        let res = await this.getConnection().batch(sql, tripletsData);
        return res;
    }
    async addReferencesBatch(refs, withId = false) {
        let refsData = [];
        refs === null || refs === void 0 ? void 0 : refs.forEach(r => {
            let arr = r.getDBArrayFormat(withId);
            if (withId)
                arr.forEach(a => { if (a == "-1")
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
    async getMaxConceptId() {
        let sql = "select max(id) as id from " + this.tables.get("concepts");
        let res = await this.getConnection().query(sql);
        if ((res === null || res === void 0 ? void 0 : res.length) > 0)
            return res[0].id;
        return 0;
    }
    async getMaxTripletId() {
        let sql = "select max(id) as id from " + this.tables.get("triplets");
        let res = await this.getConnection().query(sql);
        if ((res === null || res === void 0 ? void 0 : res.length) > 0)
            return res[0].id;
        return 0;
    }
    async getMaxReferenceId() {
        let sql = "select max(id) as id from " + this.tables.get("references");
        let res = await this.getConnection().query(sql);
        if ((res === null || res === void 0 ? void 0 : res.length) > 0)
            return res[0].id;
        return 0;
    }
}
exports.DBAdapter = DBAdapter;
//# sourceMappingURL=DBAdapter.js.map