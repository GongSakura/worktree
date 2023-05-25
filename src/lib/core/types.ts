import { StringDecoder } from "node:string_decoder";

export interface Processor {
  (context: any, next: CallableFunction): void;
}

export interface CodeWorkSpaceJSON {
  folders: { path: string; name: string }[];
}

export interface WorktreeConfig {
  path?: string;
  key?: string;
}
