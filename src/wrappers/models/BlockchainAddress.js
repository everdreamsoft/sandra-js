"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainAddress = void 0;
const DB_1 = require("../../connections/DB");
const SystemConcepts_1 = require("../../models/SystemConcepts");
const TemporaryId_1 = require("../../utils/TemporaryId");
const Entity_1 = require("../Entity");
class BlockchainAddress extends Entity_1.Entity {
    async getBalances() {
        var _a;
        let factory = this.getFactory();
        let address = this.getRefValByShortname(factory.uniqueRefName) || "";
        let concetpsArray = [];
        // If subject id is not temp id, means its subject id is already loaded and we can get balances for this address
        if (!TemporaryId_1.TemporaryId.isValid(((_a = this.getSubject()) === null || _a === void 0 ? void 0 : _a.getId()) || "temp-") && address.length > 0) {
            let sub = this.getSubject();
            // Extra verb concepts needed for query 
            let cifVerb = await SystemConcepts_1.SystemConcepts.get("contained_in_file", factory.getServerName());
            let cifTarget = await SystemConcepts_1.SystemConcepts.get("blockchainEventFile", factory.getServerName());
            let isAVerb = await SystemConcepts_1.SystemConcepts.get("is_a", factory.getServerName());
            let isATarget = await SystemConcepts_1.SystemConcepts.get("blockchainEvent", factory.getServerName());
            let onBlockchain = await SystemConcepts_1.SystemConcepts.get("onBlockchain", factory.getServerName());
            let blockchainContract = await SystemConcepts_1.SystemConcepts.get("blockchainContract", factory.getServerName());
            let quantity = await SystemConcepts_1.SystemConcepts.get("quantity", factory.getServerName());
            let tokenId = await SystemConcepts_1.SystemConcepts.get("tokenId", factory.getServerName());
            let hasSingleDestination = await SystemConcepts_1.SystemConcepts.get("hasSingleDestination", factory.getServerName());
            let source = await SystemConcepts_1.SystemConcepts.get("source", factory.getServerName());
            let id = await SystemConcepts_1.SystemConcepts.get("id", factory.getServerName());
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
                return await DB_1.DB.getInstance().server(factory.getServerName())
                    .getBalanceForAddress(address, concetpsArray);
            }
        }
        else
            throw new Error("Address not loaded to get balance ");
    }
}
exports.BlockchainAddress = BlockchainAddress;
//# sourceMappingURL=BlockchainAddress.js.map