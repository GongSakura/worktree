import { StringDecoder } from "node:string_decoder";

export interface Processor {
  (context: any, next: CallableFunction): void;
}

export interface CodeWorkSpaceFile {
  folders: { path: string; name: string }[];
}
