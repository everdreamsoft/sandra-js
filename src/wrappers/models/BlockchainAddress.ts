import { SandraAdapter } from "../../adapters/SandraAdapter";
import { DB } from "../../connections/DB";
import { SystemConcepts } from "../../models/SystemConcepts";
import { TemporaryId } from "../../utils/TemporaryId";
import { Entity } from "../Entity";
import { BlockchainAddressFactory } from "./BlockchainAddressFactory";

export class BlockchainAddress extends Entity {

    async getBalances() {

        let factory: BlockchainAddressFactory = this.getFactory() as BlockchainAddressFactory;
        let address = this.getRefValByShortname(factory.uniqueRefName) || "";
        let concetpsArray: string[] = [];

        // If subject id is not temp id, means its subject id is already loaded and we can get balances for this address
        if (!TemporaryId.isValid(this.getSubject()?.getId() || "temp-") && address.length > 0) {

            let sub = this.getSubject();

            // Extra verb concepts needed for query 
            let cifVerb = await SystemConcepts.get("contained_in_file", factory.getServerName());
            let cifTarget = await SystemConcepts.get("blockchainEventFile", factory.getServerName());
            let isAVerb = await SystemConcepts.get("is_a", factory.getServerName());
            let isATarget = await SystemConcepts.get("blockchainEvent", factory.getServerName());

            let onBlockchain = await SystemConcepts.get("onBlockchain", factory.getServerName());
            let blockchainContract = await SystemConcepts.get("blockchainContract", factory.getServerName());
            let quantity = await SystemConcepts.get("quantity", factory.getServerName());
            let tokenId = await SystemConcepts.get("tokenId", factory.getServerName());
            let hasSingleDestination = await SystemConcepts.get("hasSingleDestination", factory.getServerName());
            let source = await SystemConcepts.get("source", factory.getServerName());
            let id = await SystemConcepts.get("id", factory.getServerName());

            if (sub) {

                // Order of push should not chage, it is being used in next query 
                concetpsArray.push(cifVerb.getId());
                concetpsArray.push(cifTarget.getId());
                concetpsArray.push(isAVerb.getId());
                concetpsArray.push(isATarget.getId());
                concetpsArray.push(onBlockchain.getId());
                concetpsArray.push(blockchainContract.getId());
                concetpsArray.push(quantity.getId());
                concetpsArray.push(tokenId.getId());
                concetpsArray.push(hasSingleDestination.getId());
                concetpsArray.push(sub.getId());
                concetpsArray.push(source.getId());
                concetpsArray.push(sub.getId());
                concetpsArray.push(id.getId());
                concetpsArray.push(cifVerb.getId());

                return await (DB.getInstance().server(factory.getServerName()) as SandraAdapter)
                    .getBalanceForAddress(address, concetpsArray);

            }

        }
        else
            throw new Error("Address not loaded to get balance ");

    }

}