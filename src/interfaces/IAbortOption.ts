import { EventEmitter } from "stream";

export interface IAbortOption {
   timeout?: number,
   abortSignal?: EventEmitter,
   abort?: boolean
}