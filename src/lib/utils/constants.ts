import chalk from "chalk";

export const DEFAULT_BRANCH = "master";

export const DEFAULT_DONE_MESSAGE = `  ${chalk.greenBright.bold(`✔ DONE`)}\n`;

export const REPO_PLACEHOLDER = "<repo>";
export const BRANCH_PLACEHOLDER = "<branch>";
export const UNKNOWN_REPO = "unknown";

export const ERROR_LINK_TO_SINGLE = `Current project has already linked to a repository.
If you want to link multiple repositories, change the property "type" as "multiple" in "wt.config.json."`;

export const ERROR_LINK_DUPLICATE = (name: string) =>
  `The repository: ${name} is existed.`;
