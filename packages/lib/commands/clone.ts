/**
 * =====================================
 *   wt clone <repository> <directory>
 * =====================================
 */

import * as path from "node:path";
import { Command } from "commander";
import {
  Executer,
  GitProcessor,
  FileProcessor,
  CheckProcessor,
  ErrorProcessor,
} from "../core";
import chalk from "chalk";

export default new Command()
  .command("clone")
  .summary(
    `Create a "single-repo" worktree project and clone a git repository.  \n\n`
  )
  .description(
    `Create a "single-repo" worktree project and clone a git repository.  \n\n`
  )
  .argument("<repo-url>", "The url of a git repository.")
  .argument(
    "[directory]",
    "Specify a directory that the command is run inside it."
  )
  .action(function () {
    const context = {
      command: {
        arguments: {
          repoURL: this.processedArgs[0],
          directory: path.resolve(this.processedArgs[1] || process.cwd()),
        },
      },
      cwd: path.resolve(this.processedArgs[1] || process.cwd()),
    };

    const processes = [
      ErrorProcessor.captureError,
      CheckProcessor.checkClonePrerequisite,
      GitProcessor.cloneRepository,
      FileProcessor.initDirectory,
      FileProcessor.writeProjectConfiguration,
      FileProcessor.writeProjectCodeWorkspace,
      GitProcessor.configWorktree,
    ];

    const executer = new Executer(processes);
    executer.run(context, () => {
      process.stdout.write(`  ${chalk.greenBright.bold(`✔ DONE`)}\n`);
    });
  });
