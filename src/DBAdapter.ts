import * as mariaDb from "mariadb";
import { Connection } from "mariadb";
import { Concept } from "./Concept";
import { IDBConfig } from "./interfaces/IDBconfig";
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

    getReference() {
    }

    async getTripletByRefVal(refValue: string, refShortname: string, verb: string, target: string): Promise<Concept | undefined> {

        let sqlConcepts = "select id, shortname from " + this.tables.get("concepts") + "  where shortname in (?,?,?)";
        let concepts: [] = await this.getConnection().query(sqlConcepts, [refShortname, verb, target]);

        let refShortnameConcept: any = ((concepts.find((concept: any) => concept.shortname == refShortname)) as any).id;
        let verbConcept: any = ((concepts.find((concept: any) => concept.shortname == verb)) as any).id;
        let targetConcept: any = ((concepts.find((concept: any) => concept.shortname == target)) as any).id;

        let sql = "select t.idConceptStart as id from " + this.tables.get("triplets") + " as t join  " + this.tables.get("references") + " as r" +
            " on t.id = r.linkReferenced and t.idConceptLink = ? and t.idConceptTarget = ? and r.value = ? and" +
            " r.idConcept = ?";

        let res: any = await this.getConnection().query(sql, [verbConcept, targetConcept, refValue, refShortnameConcept]);

        if (res && res?.length > 0)
            return new Concept(res[0].id, "", null);

        return undefined;

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

    async insertConcepts(concpets: string[][]) {
        let sql = "insert into " + this.tables.get("concepts") + " values (?,?,?)";
        let res = await this.getConnection().query(sql, concpets);
        return res;
    }

    async getConcept(shortname: string): Promise<Concept> {

        let sql = "select from " + this.tables.get("concepts") + " where shortname = ?";
        let res = await this.getConnection().query(sql, shortname);

        if (res && res?.length > 0)
            return new Concept(res[0].id, res[0].code, res[0].shortname);

        return undefined;
    }

    async addConcept(c: Concept): Promise<Concept> {

        let sql = "insert into " + this.tables.get("concepts") + " values (? , ?);select LAST_INSERT_ID() as id;";
        let res = await this.getConnection().query(sql, c.getDBArrayFormat(false));

        if (res && res?.length > 0) {
            c.setId(res[0].id);
            return c;
        }

        return undefined;
    }
}
