export interface IProcessor {
  (context: any, next: CallableFunction): void;
}

export interface IContext {
  command: {
    options?: any;
    arguments?: any;
  };
  cwd: string;
  repos?: IRepo[];
  selectedRepo?: IRepo;
  reposMap?: Record<string, IRepo>;
  removeWorktrees?: string[][];
  unLinkRepo?: IRepo;
  projectPath?: string;
  projectConfig?: IProjectConfig;
  projectConfigPath?: string;
  projectType?: EPROJECT_TYPE;
  codeWorkspace?: ICodeWorkSpaceConfig;
  [k: string]: any;
}
export interface IWorkspace {
  path?: string;
  name?: string;
}

export interface ICodeWorkSpaceConfig {
  folders: IWorkspace[];
}

export interface IGitConfig {
  path?: string;
  reponame?: string;
  alias?: string;
}

export interface IRepo {
  alias?: string;
  name: string;
  path?: string;
  worktrees?: string[][];
  branches?: string[];
  gitDir?: string;
}

export interface IProjectConfig {
  repos: IRepo[];
  type: EPROJECT_TYPE;
}

export interface IMultiRepoWorktreePaths {
  [key: string]: string[][];
}

export enum EPROJECT_FILES {
  CODE_WORKSPACE = "wt.code-workspace",
  CONFIGURATION = "wt.config.json",
  NULL = "",
}

export enum EPROJECT_TYPE {
  SINGLE = "single",
  MULTIPLE = "multiple",
}

export enum EGIT_CONFIGURATION {
  PATH = "wt.config.path",
  REPONAME = "wt.config.reponame",
  ALIAS = "wt.config.alias",
}
