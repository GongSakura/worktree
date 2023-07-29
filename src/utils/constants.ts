/**
 * To place all constants
 */
import chalk from "chalk";

export const DEFAULT_BRANCH = "master";
export const REPO_PLACEHOLDER = "<repo>";
export const BRANCH_PLACEHOLDER = "<branch>";
export const UNKNOWN_REPO = "unknown";

export const DEFAULT_DONE_MESSAGE = `  ${chalk.greenBright.bold(`✔ DONE`)}\n`;
export const DEFAULT_ERROR_MESSAGE = `  ${chalk.redBright.bold("✘ ERROR:")}\n`;

export const ERROR_EMPTY_REPOS = "Hasn't linked to any repository";
export const ERROR_MISSING_CONFIG = `"wt.config.json" is missing.`;
export const ERROR_MISSING_CONFIG_TYPE = `The property "type" in "wt.config.json" is missing.`;
export const ERROR_MISSING_OPTION_REPO = `The option "--repo" is missing.`;
export const ERROR_MISSING_ARGS_BRANCH_NAME = `The argument "branch-name" is missing.`;

export const ERROR_EXECUTE_OUTSIDE =
  "Cannot execute commands outside a worktree project.";
export const ERROR_EXECUTE_IN_GITDIR = `Cannot execute commands inside a ".git" folder`;
export const ERROR_REPO_NOT_EXSITED = (repo: string) => {
  return `Cannot find the repository: "${repo}" in the project`;
};
export const ERROR_NO_AVAILABLE_BRANCH = (repo: string) => {
  return `No available branch in the repository: ${repo}`;
};
export const ERROR_NO_AVAILABLE_WORKTREE = `No available worktrees`;
export const ERROR_REMOVE_WORKTREE = `No available worktrees can be removed`;
export const ERROR_REMOVE_MAIN_WORKTREE = (name: string) => {
  return `Cannot remove "${name}", because it's inside the main worktree.\nTo remove a main worktree, use "wt unlink".`;
};

export const ERROR_LINK_DUPLICATE = (repo: string) => {
  return `The repository: ${repo} is existed.`;
};
export const ERROR_LINK_TO_SINGLE = `Current project has already linked to a repository.
  If you want to link multiple repositories, change the property "type" as "multiple" in "wt.config.json."`;

export const ERROR_CREATE_IN_GITDIR = `Cannot create inside a ".git" folder`;
export const ERROR_CREATE_IN_DIR = (name: string) => {
  return `Cannot create the project inside a file path: ${name}`;
};
export const ERROR_INIT_EXISTED = (repo: string) => {
  return `The directory: "${repo}" has already been initialize`;
};
export const ERROR_INIT_INSIDE = (projectPath: string) => {
  return `Cannot init inside a worktree project: ${projectPath}`;
};
