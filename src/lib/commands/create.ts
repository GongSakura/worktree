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
        options: this.opts(),
        arguments: {
          directory: path.resolve(this.processedArgs[0] || ""),
        },
      },
      cwd: process.cwd(),
    };

    const processes = [
      ErrorProcessor.captureError,
      CheckProcessor.checkCreatePrerequisite,
      FileProcessor.writeProjectConfiguration,
    ];
    const executer = new Executer(processes);
    executer.run(context, done);
  };
}

export function createCommand(action: (...args: any[]) => void) {
  return new Command()
    .name("create")
    .summary(`Create a "single-repo" or "multi-repos" worktree project.\n\n`)
    .description(
      `To create a "single-repo" or "multi-repos" worktree project.\n\n`
    )
    .option("-s, --single", "create an empty project for single repository")
    .argument(
      "[directory]",
      "(optional) Specify a directory that the command is run inside it. The default is the current directory\n\n"
    )
    .action(action);
}
