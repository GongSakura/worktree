/**
 * Handle "git worktree remove"
 */

/**
 * =============================================
 *   wt update
 * =============================================
 */
import { Command } from "commander";
import {
  Executer,
  FileProcessor,
  ErrorProcessor,
  CheckProcessor,
} from "../core";

export default new Command()
  .command("update")
  .summary("Update the project configuration.\n")
  .description(`Update the project configuration`)
  .helpOption("-h, --help", "Display help for command")
  .action(function () {
    const context = {
      command: {
        options: this.opts(),
        arguments: {
          branchName: this.processedArgs[0],
        },
      },
      cwd: process.cwd(),
    };

    const processes = [
      ErrorProcessor.captureError,
      CheckProcessor.checkUpdatePrerequisite,
      FileProcessor.updateProjectCodeWorkspace,
      FileProcessor.updateProjectConfiguration,
    ];
    const executer = new Executer(processes);
    executer.run(context);
  });
