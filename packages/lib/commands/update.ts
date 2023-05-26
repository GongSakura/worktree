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
  GitProcessor,
} from "../core";

export default new Command()
  .command("update")
  .summary("Update the project configuration.\n")
  .description(`Update the project configuration`)
  .helpOption("-h, --help", "Display help for command")
  .action(function () {
    const context = {
      cwd: process.cwd(),
    };

    const processes = [
      ErrorProcessor.captureError,
      CheckProcessor.checkUpdatePrerequisite,
      CheckProcessor.inspectPotentialWorktrees,
      GitProcessor.repairWorktree,
      FileProcessor.updateProjectCodeWorkspace,
      FileProcessor.updateProjectConfiguration,
    ];
    const executer = new Executer(processes);
    executer.run(context,()=>console.log('done update'));
  });
