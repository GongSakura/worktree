/**
 * ==================================
 *   wt link <repo-url> <repo-name>
 * ==================================
 */

import { Command } from "commander";

import {
  CheckProcessor,
  ErrorProcessor,
  Executer,
  FileProcessor,
  GitProcessor,
} from "../core";
import chalk from "chalk";


export default new Command()
  .name("link")
  .alias("ln")
  .summary("Link a Git repo into current project\n\n")
  .description(
    "To link a Git repo into current project, <repo-url> can be a remote url or the local path\n\n"
  )
  .argument(
    "<repo-url>",
    "The location of the git repository, it repo-url is the local directory, then it will create a symbolic link\n\n"
  )
  .argument(
    "<repo-name>",
    `Specify an alias name for the git repository, and it will be used as the option --repo in "wt remove" or "wt add" commands.\n\n`
  )
  .action(function () {
    const context = {
      command: {
        arguments: {
          repoURL: this.processedArgs[0],
          repoName: this.processedArgs[1],
        },
      },
      cwd: process.cwd(),
    };
 
    const processes = [
      ErrorProcessor.captureError,
      CheckProcessor.checkLinkPrerequisite,
      GitProcessor.linkRepository,
      FileProcessor.linkDirectory,
      FileProcessor.writeProjectCodeWorkspace,
      FileProcessor.writeProjectConfiguration,
      GitProcessor.configWorktree,
    ];
    const executer = new Executer(processes);
    executer.run(context, () => {
      process.stdout.write(`  ${chalk.greenBright.bold(`✔ DONE`)}\n`);
    });
  });
