/**
 * =============================
 *   wt open <directory>
 * =============================
 */

import { Command } from "commander";
import {
  CheckProcessor,
  ErrorProcessor,
  Executer,
  FileProcessor,
} from "../core";



export function openAction(done: CallableFunction) {
  return function () {
    const context = {
      command: {
        options: this.opts(),
        arguments: {
          codeWorkspacePath: this.processedArgs[0],
        },
      },
      cwd: process.cwd(),
    };

    const processes = [
      ErrorProcessor.captureError,
      CheckProcessor.checkOpenPrerequisite,
      FileProcessor.openCodeWorkspace,
    ];
    const executer = new Executer(processes);
    executer.run(context, done);
  };
}

export function openCommand(action: (...args: any[]) => void) {
  return new Command()
    .command("open")
    .summary("Open code-workspace file.\n\n")
    .description(
      `Open code-workspace file`
    )
    .helpOption("-h, --help", "Display help for command")
    .argument(
      "[code-workspace-path]",
      "(optional) If a path is given, then directly open it."
    )
    .action(action);
}
