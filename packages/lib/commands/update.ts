/**
 * Handle "git worktree repair"
 */

/**
 * ===============
 *   wt update
 * ===============
 */
import { Command } from "commander";
import {
  Executer,
  FileProcessor,
  ErrorProcessor,
  CheckProcessor,
  GitProcessor,
} from "../core";
import chalk from "chalk";

export default new Command()
  .command("update")
  .alias("ud")
  .summary("Update the project configuration.\n\n")
  .description(`Update the project configuration`)
  .helpOption("-h, --help", "Display help for command")
  .action(function () {
    const context = {
      command: {
        options: {},
        arguments: {},
      },
      cwd: process.cwd(),
    };

    const processes = [
      ErrorProcessor.captureError,
      CheckProcessor.checkUpdatePrerequisite,
      CheckProcessor.inspectPotentialWorktrees,
      FileProcessor.updateDirectory,
      GitProcessor.repairWorktree,
      FileProcessor.writeProjectCodeWorkspace,
      FileProcessor.writeProjectConfiguration,
    ];
    const executer = new Executer(processes);
    executer.run(context, () => {
      process.stdout.write(`  ${chalk.greenBright.bold(`✔ DONE`)}\n`);
    });
  });
