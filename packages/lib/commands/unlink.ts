/**
 * =========================
 *   wt unlink <repo-name>
 * =========================
 */

import { Command } from "commander";

import {
  CheckProcessor,
  ErrorProcessor,
  Executer,
  FileProcessor,
} from "../core";
import chalk from "chalk";

export default new Command()
  .name("unlink")
  .alias("ul")
  .summary("Remove a Git repository from current project\n\n")
  .description("To remove a Git repository from current project\n\n")
  .argument(
    "[repo-name]"
  )
  .action(function () {
    const context = {
      command: {
        arguments: {
          repoName: this.processedArgs[0],
        },
      },
      cwd: process.cwd(),
    };

    const processes = [
      ErrorProcessor.captureError,
      CheckProcessor.checkUnlinkPrerequisite,
      FileProcessor.unlinkDirectory,
      FileProcessor.writeProjectCodeWorkspace,
      FileProcessor.writeProjectConfiguration,
    ];
    const executer = new Executer(processes);
    executer.run(context, () => {
      process.stdout.write(`  ${chalk.greenBright.bold(`✔ DONE`)}\n`);
    });
  });
