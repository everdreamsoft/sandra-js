"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIService = void 0;
const axios_1 = __importDefault(require("axios"));
const LogManager_1 = require("./loggers/LogManager");
const Utils_1 = require("./Utils");
class APIService {
    constructor() { }
    static async get(url, timeout = 60000, waitTimeInMs) {
        try {
            const source = axios_1.default.CancelToken.source();
            if (waitTimeInMs)
                await Utils_1.Utils.wait(waitTimeInMs);
            const timeoutFnc = setTimeout(() => {
                source.cancel();
            }, timeout);
            const response = await axios_1.default.get(url, { cancelToken: source.token });
            clearTimeout(timeoutFnc);
            return APIService.createApiResponse(null, response.data);
        }
        catch (e) {
            e.appData = "Get Url - " + url;
            LogManager_1.LogManager.getInstance().error(e);
            return APIService.createApiResponse(e, null);
        }
    }
    static createApiResponse(error, data) {
        var _a;
        if (error) {
            return {
                data: null,
                error: {
                    code: error.code,
                    status: (_a = error.response) === null || _a === void 0 ? void 0 : _a.status,
                    stack: error.stack,
                    message: error.message,
                    appData: error.appData
                }
            };
        }
        else
            return {
                data: data,
                error: null
            };
    }
}
exports.APIService = APIService;
//# sourceMappingURL=APIService.js.map