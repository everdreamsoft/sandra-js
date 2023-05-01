import { EventEmitter } from "stream";

export interface IQueryOption {
   timeout?: number,
   abort?: boolean,
   abortSignal?: EventEmitter
}