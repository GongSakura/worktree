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

export function unlinkAction(done: CallableFunction) {
  return function () {
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
    executer.run(context, done);
  };
}

export function unlinkCommand(action: (...args: any[]) => void) {
  return new Command()
    .name("unlink")
    .summary("Remove a Git repository from current project.\n\n")
    .description("To remove a Git repository from current project.\n\n")
    .argument(
      "[repo-name]",
      "(optional) The repository to be remove from current project.\n\n"
    )
    .action(action);
}
