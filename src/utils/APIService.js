"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIService = void 0;
const axios_1 = __importDefault(require("axios"));
const LogManager_1 = require("../loggers/LogManager");
const Common_1 = require("./Common");
class APIService {
    constructor() { }
    /**
     * Calls the given url as GET and sends back the response
     * @param url
     * @param timeout
     * @param waitTimeInMs
     * @returns Returns the response of given url
     */
    static async get(url, timeout = 60000, waitTimeInMs) {
        try {
            url = Common_1.Common.createIPFSUrlIfFound(url);
            const source = axios_1.default.CancelToken.source();
            if (waitTimeInMs)
                await Common_1.Common.wait(waitTimeInMs);
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
    /**
     * POST given url with given payload
     * @param url
     * @param payload
     * @returns Returns promise of IAPIResponse
     */
    static async post(url, payload) {
        try {
            const response = await axios_1.default.post(url, payload, {
                headers: { 'content-type': 'application/json' }
            });
            return APIService.createApiResponse(null, response.data);
        }
        catch (e) {
            e.appData = "Post Url - " + url;
            LogManager_1.LogManager.getInstance().error(e);
            return APIService.createApiResponse(e, null);
        }
    }
    /**
     *
     * @param error
     * @param data
     * @returns Creates IAPIResponse response object with give error and data
     */
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
                error: undefined
            };
    }
}
exports.APIService = APIService;
//# sourceMappingURL=APIService.js.map