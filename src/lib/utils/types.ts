/**
 * middleware
 */
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
  projectType?: PROJECT_TYPE;
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

/**
 * path: the value of wt.config.path in git config
 */
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

/**
 * every time we read project configuration, have to add the path
 */
export interface IProjectConfig {
  repos: IRepo[];
  type: PROJECT_TYPE;
  projectPath: string;
}

export interface IMultiRepoWorktreePaths {
  [key: string]: string[][];
}

export enum PROJECT_FILES {
  CODE_WORKSPACE = "wt.code-workspace",
  CONFIGURATION = "wt.config.json",
  NULL = "",
}

export enum PROJECT_TYPE {
  SINGLE = "single",
  MULTIPLE = "multiple",
}

export enum GIT_CONFIG {
  PATH = "wt.config.path",
  REPONAME = "wt.config.reponame",
}
