"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainAddressFactory = void 0;
const EntityFactory_1 = require("../EntityFactory");
const BlockchainAddress_1 = require("./BlockchainAddress");
class BlockchainAddressFactory extends EntityFactory_1.EntityFactory {
    constructor(chain, uniqueRefConcept, server) {
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
        this.uniqueRefName = "address";
    }
    async create(refs, upsert) {
        return this.create(refs, upsert);
    }
    createEntity() {
        return new BlockchainAddress_1.BlockchainAddress(this);
    }
}
exports.BlockchainAddressFactory = BlockchainAddressFactory;
//# sourceMappingURL=BlockchainAddressFactory.js.map