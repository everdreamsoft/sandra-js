import { IAPIError } from "./IAPIError";

export interface IAPIResponse {
   data: any | undefined
   error: IAPIError | undefined,
}