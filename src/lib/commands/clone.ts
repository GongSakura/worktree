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

export function cloneAction(done: CallableFunction) {
  return function () {
    const context = {
      command: {
        arguments: {
          repoURL: this.processedArgs[0],
          directory: path.resolve(this.processedArgs[1]||""),
        },
      },
      cwd: process.cwd(),
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
    executer.run(context, done);
  };
}

export function cloneCommand(action: (...args: any[]) => void) {
  return new Command()
    .command("clone")
    .summary(
      `Create a "single-repo" worktree project and clone a git repository.  \n\n`
    )
    .description(
      `Create a "single-repo" worktree project and clone a git repository.  \n\n`
    )
    .argument("<repo-url>", "(required) The url of a git repository.\n\n")
    .argument(
      "[directory]",
      "(optional) Specify a directory that the command is run inside it. The default is the current directory\n\n"
    )
    .action(action);
}
