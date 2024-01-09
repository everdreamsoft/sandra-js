import { IDBConfig } from "../interfaces/IDBconfig";
import { LogManager } from "../loggers/LogManager";
import { DBBaseAdapter } from "./DBBaseAdapter";

/****
 * Custom class to call Sandra SQL queries directly for more efficient data retrieval
 */
export class SandraSQLAdapter extends DBBaseAdapter {

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

    async getAssets(filter: any, lastId: number | undefined = undefined, limit: number = 100): Promise<any[]> {

        let values = [];

        let sql = `select t1.id tripletId, t1.idConceptStart as "id", 
                    r1.value as "assetId", r2.value as "moongaCardId", r3.value as "cannon_assetId",
                    r4.value as "imgURL",r5.value as "onChainMetaDataURL", r6.value as "assetName",  r7.value as "Name", r8.value as "bindToAbo", 
                    r9.value as "mintDate", 
                    FROM_UNIXTIME(CAST(r.value AS UNSIGNED)) AS creationTimestamp
                    from  ${this.tables.get(this.TABLE_TRIPLETS)} as t1 
                    join  ${this.tables.get(this.TABLE_TRIPLETS)} as t2 on t1.idConceptStart = t2.idConceptStart 
                    and t1.idConceptLink = ( select id from   ${this.tables.get(this.TABLE_CONCEPTS)} where shortname = "contained_in_file" ) and t1.idConceptTarget = ( select id from   ${this.tables.get(this.TABLE_CONCEPTS)} where shortname = "blockchainizableAssets" )  /* contained_in_file -> blockchainizableAssets */
                    and t2.idConceptLink = ( select id from   ${this.tables.get(this.TABLE_CONCEPTS)} where shortname = "is_a" ) and t2.idConceptTarget = ( select id from   ${this.tables.get(this.TABLE_CONCEPTS)} where shortname = "blockchainizableAsset" )  /* is_a -> blockchainizableAsset */
                    join  ${this.tables.get(this.TABLE_REFERENCES)} as r1 on t1.id = r1.linkReferenced 
                    and r1.idConcept =  ( select id from   ${this.tables.get(this.TABLE_CONCEPTS)} where shortname = "assetId" ) 
                    #ASSETID#  /* assetId -> "asset id" */
                    left join  ${this.tables.get(this.TABLE_REFERENCES)} as r2 on t1.id = r2.linkReferenced 
                    and r2.idConcept =  ( select id from   ${this.tables.get(this.TABLE_CONCEPTS)} where shortname = "moongaCardId" )   /* moongaCardId */
                    left join  ${this.tables.get(this.TABLE_REFERENCES)} as r3 on t1.id = r3.linkReferenced 
                    and r3.idConcept =  ( select id from   ${this.tables.get(this.TABLE_CONCEPTS)} where shortname = "cannon_assetId" )   /* cannon_assetId */
                    left join  ${this.tables.get(this.TABLE_REFERENCES)} as r4 on t1.id = r4.linkReferenced 
                    and r4.idConcept = ( select id from   ${this.tables.get(this.TABLE_CONCEPTS)} where shortname = "imgURL" )   /* imgURL */
                    left join  ${this.tables.get(this.TABLE_REFERENCES)} as r5 on t1.id = r5.linkReferenced 
                    and r5.idConcept =  ( select id from   ${this.tables.get(this.TABLE_CONCEPTS)} where shortname = "onChainMetaDataURL" )   /* onChainMetaDataURL */
                    left join  ${this.tables.get(this.TABLE_REFERENCES)} as r6 on t1.id = r6.linkReferenced 
                    and r6.idConcept =  ( select id from   ${this.tables.get(this.TABLE_CONCEPTS)} where shortname = "assetName" )   /* assetName */
                    left join  ${this.tables.get(this.TABLE_REFERENCES)} as r7 on t1.id = r7.linkReferenced 
                    and r7.idConcept =  ( select id from   ${this.tables.get(this.TABLE_CONCEPTS)} where shortname = "Name" )   /* Name */
                    left join  ${this.tables.get(this.TABLE_REFERENCES)} as r8 on t1.id = r8.linkReferenced 
                    and r8.idConcept =  ( select id from   ${this.tables.get(this.TABLE_CONCEPTS)} where shortname = "bindToAbo" )  /* bindToAbo */
                    left join  ${this.tables.get(this.TABLE_REFERENCES)} as r9 on t1.id = r9.linkReferenced 
                    and r9.idConcept =  ( select id from   ${this.tables.get(this.TABLE_CONCEPTS)} where shortname = "mintDate" )  /* mintDate */
                    join  ${this.tables.get(this.TABLE_REFERENCES)} as r on t1.id = r.linkReferenced 
                    and r.idConcept =  ( select id from  ${this.tables.get(this.TABLE_CONCEPTS)} where shortname = "creationTimeStamp" )  /* creationTimeStamp*/  
                    #LASTID#
                    #MOONGA# /* moongaCardId */
                    #CANNON# /* cannon_assetId */
                    ORDER BY t1.id  DESC limit ?`


        if (filter?.assetId) {
            if (filter?.checkSubstring || filter?.checkSubstring === undefined) {
                filter.assetId = "%" + filter.assetId + "%";
                sql = sql.replace("#ASSETID#", `and r1.value like ?`);
            }
            else
                sql = sql.replace("#ASSETID#", `and r1.value = ?`);
            values.push(filter.assetId);
        }
        else {
            sql = sql.replace("#ASSETID#", "");
        }

        if (lastId) {
            values.push(lastId);
            sql = sql.replace("#LASTID#", `and t1.id < ?`);
        }
        else
            sql = sql.replace("#LASTID#", "");

        if (filter?.moongaCardId === null) {
            sql = sql.replace("#MOONGA#", `and r2.value is null`);
        }
        else if (filter?.moongaCardId) {
            sql = sql.replace("#MOONGA#", `and r2.value = ?`);
            values.push(filter.moongaCardId);
        }
        else {
            sql = sql.replace("#MOONGA#", "");
        }

        if (filter?.cannon_assetId === null) {
            sql = sql.replace("#CANNON#", `and r3.value is null`);
        }
        else if (filter?.cannon_assetId) {
            sql = sql.replace("#CANNON#", `and r3.value = ?`);
            values.push(filter.cannon_assetId);
        }
        else {
            sql = sql.replace("#CANNON#", "");
        }


        values.push(limit);

        let [rows, fields] = await this.getConnectionPool().query(sql, values);

        return rows;


    }


}
