import axios from "axios";
import { IAPIError } from "./interfaces/IAPIError";
import { IAPIResponse } from "./interfaces/IAPIResponse";
import { LogManager } from "./loggers/LogManager";
import { Utils } from "./Utils";


export class APIService {

    constructor() { }

    static async get(url: string, timeout: number = 60000, waitTimeInMs?: number): Promise<IAPIResponse> {

        try {

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
