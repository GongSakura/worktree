/**
 * =============================
 *   wt create <directory>
 * =============================
 */

import { Command } from "commander";
import * as path from "node:path";
import {
  CheckProcessor,
  ErrorProcessor,
  Executer,
  FileProcessor,
} from "../core";

export function createAction(done: CallableFunction) {
  return function () {
    const context = {
      command: {
        arguments: {
          directory: path.resolve(this.processedArgs[0]),
        },
      },
      cwd: path.resolve(this.processedArgs[0]),
    };

    const processes = [
      ErrorProcessor.captureError,
      CheckProcessor.checkCreatePrerequisite,
      FileProcessor.writeProjectCodeWorkspace,
      FileProcessor.writeProjectConfiguration,
    ];
    const executer = new Executer(processes);
    executer.run(context, done);
  };
}

export function createCommand(action: (...args: any[]) => void) {
  return new Command()
    .name("create")
    .alias("c")
    .summary("Create an empty worktree project.\n\n")
    .description(
      "To create an empty worktree project that used for multiple git repositories.\n\n"
    )
    .argument(
      "[directory]",
      "Specify a directory that the command is run inside it.",
      process.cwd()
    )
    .action(action);
}
