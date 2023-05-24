import { Concept } from "../../models/Concept";
import { Reference } from "../../models/Reference";
import { EntityFactory } from "../EntityFactory";
import { BlockchainAddress } from "./BlockchainAddress";

export class BlockchainAddressFactory extends EntityFactory {

    readonly uniqueRefName = "address";

    constructor(chain: string | undefined, uniqueRefConcept: Concept, server: string) {

        let is_a = "generalIsA";

        switch (chain) {
            case "ethereum":
                is_a = "ethAddress";
                break;
            case "binance":
                is_a = "bscAddress";
                break;
        }

        super(is_a, "blockchainAddressFile", uniqueRefConcept, server);

    }

    override async create(refs: Reference[], upsert?: boolean | undefined): Promise<BlockchainAddress> {
        return this.create(refs, upsert);
    }

    override  createEntity(): BlockchainAddress {
        return new BlockchainAddress(this);
    }

}