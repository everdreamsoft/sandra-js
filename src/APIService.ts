import axios from "axios";
import { IAPIResponse } from "./interfaces/IAPIResponse";
import { LogManager } from "./loggers/LogManager";
import { Utils } from "./Utils";


export class APIService {

    constructor() { }

    /**
     * Calls the given url as GET and sends back the response
     * @param url 
     * @param timeout 
     * @param waitTimeInMs 
     * @returns Returns the response of given url
     */
    static async get(url: string, timeout: number = 60000, waitTimeInMs?: number): Promise<IAPIResponse> {

        try {

            url = Utils.createIPFSUrlIfFound(url);

            const source = axios.CancelToken.source();

            if (waitTimeInMs)
                await Utils.wait(waitTimeInMs);

            const timeoutFnc = setTimeout(() => {
                source.cancel();
            }, timeout);

            const response = await axios.get(url, { cancelToken: source.token });

            clearTimeout(timeoutFnc)

            return APIService.createApiResponse(null, response.data);

        } catch (e) {
            e.appData = "Get Url - " + url;
            LogManager.getInstance().error(e);
            return APIService.createApiResponse(e, null);
        }

    }

    /**
     * POST given url with given payload
     * @param url 
     * @param payload 
     * @returns Returns promise of IAPIResponse 
     */
    static async post(url: string, payload: any) {

        try {
            const response = await axios.post(url, payload,
                {
                    headers: { 'content-type': 'application/json' }
                }
            );

            return APIService.createApiResponse(null, response.data);

        } catch (e) {
            e.appData = "Post Url - " + url;
            LogManager.getInstance().error(e);
            return APIService.createApiResponse(e, null);
        }

    }

    /**
     * 
     * @param error 
     * @param data 
     * @returns Creates IAPIResponse response object with give error and data
     */
    static createApiResponse(error: any, data: any): IAPIResponse {

        if (error) {
            return {
                data: null,
                error: {
                    code: error.code,
                    status: error.response?.status,
                    stack: error.stack,
                    message: error.message,
                    appData: error.appData
                }
            } as IAPIResponse
        }
        else
            return {
                data: data,
                error: null
            } as IAPIResponse
    }
}
