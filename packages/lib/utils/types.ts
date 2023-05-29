export interface IProcessor {
  (context: any, next: CallableFunction): void;
}

export interface IWorkspace {
  path?: string;
  name?: string;
}

export interface ICodeWorkSpaceConfig {
  folders: IWorkspace[];
}

export interface IWorktreeConfig {
  path?: string;
  repoName?:string;
}

export interface IProjectConfig {
  [key:string]:string
}

export enum PROJECT_FILES {
  CODE_WORKSPACE = "wt.code-workspace",
  CONFIGURATION = "wt.config.json",
}

export interface IMultiRepoWorktreePaths {
  [key: string]: string[];
}
