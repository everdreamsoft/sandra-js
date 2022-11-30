import { IAPIError } from "./IAPIError";

export interface IAPIResponse {
   error: IAPIError,
   data: any
}