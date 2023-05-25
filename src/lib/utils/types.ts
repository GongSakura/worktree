import { StringDecoder } from "node:string_decoder";

export interface Processor {
  (context: any, next: CallableFunction): void;
}

export interface CodeWorkSpace {
  folders: { path: string; name: string }[];
}

export interface WorktreeConfig {
  path?: string;
  key?: string;
}
export interface ProjectConfig {
  mainWorktreePath?: string;
  linkedWorktreePaths?: [];
}

export enum PROJECT_FILES{
  CODE_WORKSPACE="wt.code-workspace",
  CONFIGURATION="wt.config.json"
}