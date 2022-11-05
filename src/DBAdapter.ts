import * as mariaDb from "mariadb";
import { Connection } from "mariadb";
import { Concept } from "./Concept";
import { IDBConfig } from "./interfaces/IDBconfig";
import { Reference } from "./Reference";
import { Triplet } from "./Triplet";
import { Utils } from "./Utils";

export class DBAdapter {

    private static instance: DBAdapter;

    private connection: Connection | undefined;
    private tables: Map<string, string> = new Map<string, string>();

    private readonly config: IDBConfig;

    private constructor(config: IDBConfig) {

        this.config = config;

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
    async getEntityTriplet(ref: Reference, verb: Concept, target: Concept):Promise<Triplet[]> {

        let sql = "select t.id, c.id as subjectId, c.code as subjectCode, c.shortname as subjectShortname, t.idConceptLink as verb, t.idConceptTarget as target from " + this.tables.get("triplets") + " as t join  " + this.tables.get("references") + " as r" +
            " on t.id = r.linkReferenced and t.idConceptLink = ? and t.idConceptTarget = ? and r.value = ? and" +
            " r.idConcept = ? join " + this.tables.get("concepts") + " as c on t.idConceptStart = c.id";

        let res: any = await this.getConnection().query(sql, [verb.getId(), target.getId(), ref.getValue(), ref.getIdConcept().getId()]);
        let triplets: Triplet[] = [];

        if (res?.length > 0) {

            res.forEach(row => {
                triplets.push(
                    new Triplet(
                        res[0].id,
                        new Concept(res[0].subjectId, res[0].subjectCode, res[0].subjectShortname),
                        verb,
                        target
                    )
                );
            });
        }

        return triplets;

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

    /*
       async getTripletByRefVal(refValue: string, refShortname: string, verb: string, target: string): Promise<Triplet> {
   
           let sqlConcepts = "select id, code, shortname from " + this.tables.get("concepts") + "  where shortname in (?,?,?)";
           let concepts: [] = await this.getConnection().query(sqlConcepts, [refShortname, verb, target]);
   
           let refShortnameConcept: any = ((concepts.find((concept: any) => concept.shortname == refShortname)));
           let verbConcept: any = ((concepts.find((concept: any) => concept.shortname == verb)));
           let targetConcept: any = ((concepts.find((concept: any) => concept.shortname == target)));
   
           if (refShortnameConcept && verbConcept && targetConcept) {
   
               let sql = "select t.id, t.idConceptStart as subject, t.idConceptLink as verb, t.idConceptTarget as target from " + this.tables.get("triplets") + " as t join  " + this.tables.get("references") + " as r" +
                   " on t.id = r.linkReferenced and t.idConceptLink = ? and t.idConceptTarget = ? and r.value = ? and" +
                   " r.idConcept = ?";
   
               let res: any = await this.getConnection().query(sql, [verbConcept.id, targetConcept.id, refValue, refShortnameConcept.id]);
   
               if (res?.length > 0) {
                   return new Triplet(res[0].id,
                       new Concept(res[0].subject, "", ""),
                       new Concept(verbConcept.id, "", verb),
                       new Concept(targetConcept.id, "", target));
               }
   
           }
   
           return null;
   
       }
   
       async getTripletsBySubjectId(subjectId: number) {
   
           let sql = "SELECT t.id as tripletId, t.idConceptStart as Subject, c.code as SubjectCode , " +
               "t.idConceptLink as Verb, c2.shortname as VerbShortname , t.idConceptTarget as target, c3.shortname as TargetShortname FROM " +
               this.tables.get("triplets") + " as t join " +
               this.tables.get("concepts") + " as c on " +
               "c.id = t.idConceptStart and  t.idConceptStart = ? " +
               "join " + this.tables.get("concept") + " as c2 on c2.id = t.idConceptLink " +
               "join " + this.tables.get("concept") + " as c3 on c3.id = t.idConceptTarget";
   
           let res = await this.getConnection().query(sql, [subjectId]);
   
           return res;
   
       }
   
       async getReferencesBySubjectId(subjectId: number) {
   
           let sql = "SELECT r.*, c.shortname FROM " + this.tables.get("references") + " as r join " +
               this.tables.get("concepts") + " as c on " +
               "c.id = r.idConcept and  r.linkReferenced in " +
               "(select id from " + this.tables.get("triplets") + " as t where idConceptStart = ?);";
           let res = await this.getConnection().query(sql, [subjectId]);
           return res;
   
       }
   */

    async insertConcepts(concpets: string[][]) {
        let sql = "insert into " + this.tables.get("concepts") + " (id, code, shortname) values (?,?,?)";
        let res = await this.getConnection().query(sql, concpets);
        return res;
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

    async addConcept(c: Concept): Promise<Concept> {

        let sql = "insert into " + this.tables.get("concepts") + " set code = ?, shortname = ?";
        let res = await this.getConnection().query(sql, c.getDBArrayFormat(false));

        if (res && res?.insertId) {
            c.setId(Number(res.insertId));
            return c;
        }

        return undefined;
    }

    async addTriplet(t: Triplet): Promise<Triplet> {

        let sql = "insert into " + this.tables.get("triplets") + " set idConceptStart = ?, idConceptLink = ?, idConceptTarget = ?";
        let res = await this.getConnection().query(sql, t.getDBArrayFormat(false));

        if (res && res?.insertId) {
            t.setId(Number(res.insertId));
            return t;
        }

        return undefined;
    }

    async addRefs(ref: Reference): Promise<Reference> {

        let sql = "insert into " + this.tables.get("references") + " set idConcept = ?, linkReferenced = ?, value = ?";
        let res = await this.getConnection().query(sql, ref.getDBArrayFormat(false));

        if (res && res?.insertId) {
            ref.setId(Number(res.insertId));
            return ref;
        }

        return undefined;
    }

}
