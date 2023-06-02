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

export function updateAction(done: CallableFunction) {
  return function () {
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
      GitProcessor.inspectRepository,
      FileProcessor.updateDirectory,
      GitProcessor.repairWorktree,
      FileProcessor.writeProjectCodeWorkspace,
      FileProcessor.writeProjectConfiguration,
    ];
    const executer = new Executer(processes);
    executer.run(context, done);
  };
}

export function updateCommand(action: (...args: any[]) => void) {
  return new Command()
    .command("update")
    .alias("ud")
    .summary("Update the project configuration.\n\n")
    .description(`Update the project configuration.\n\n`)
    .helpOption("-h, --help", "Display help for command.")
    .action(action);
}
