import chalk from "chalk";

export const DEFAULT_BRANCH = "master";
export const REPO_PLACEHOLDER = "<repo>";
export const BRANCH_PLACEHOLDER = "<branch>";
export const UNKNOWN_REPO = "unknown";

export const DEFAULT_DONE_MESSAGE = `  ${chalk.greenBright.bold(`✔ DONE`)}\n`;
export const DEFAULT_ERROR_MESSAGE = `  ${chalk.redBright.bold("✘ ERROR:")}\n`;

export const ERROR_EMPTY_REPOS = "Hasn't linked to any repository";
export const ERROR_MISSING_CONFIG = `"wt.config.json" is missing.`;
export const ERROR_EXECUTE_OUTSIDE =
  "Cannot execute commands outside a worktree directory.";

export const ERROR_CONFIG_MISSING_TYPE = `The property "type" in "wt.config.json" is missing.`;

export const ERROR_LINK_DUPLICATE = (name: string) => {
  return `The repository: ${name} is existed.`;
};
export const ERROR_LINK_TO_SINGLE = `Current project has already linked to a repository.
  If you want to link multiple repositories, change the property "type" as "multiple" in "wt.config.json."`;

export const ERROR_CREATE_IN_GITDIR = `Cannot create inside the ".git" folder`;
export const ERROR_CREATE_IN_DIR = (name: string) => {
  return new Error(`Cannot create the project inside a file path: ${name}`);
};
export const ERROR_HAS_INITED = "";
