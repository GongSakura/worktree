/**
 * =======================
 *   wt init <directory>
 * =======================
 */
import * as path from "node:path";
import { Command } from "commander";
import chalk from "chalk";
import {
  Executer,
  GitProcessor,
  FileProcessor,
  CheckProcessor,
  ErrorProcessor,
} from "../core";

export function initAction(done: CallableFunction) {
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
      CheckProcessor.checkInitPrerequisite,
      GitProcessor.initRepository,
      FileProcessor.initDirectory,
      GitProcessor.repairWorktree,
      FileProcessor.writeProjectConfiguration,
      FileProcessor.writeProjectCodeWorkspace,
      GitProcessor.configWorktree,
    ];

    const executer = new Executer(processes);
    executer.run(context, done);
  };
}
export function initCommand(action: (...args: any[]) => void) {
  return new Command()
    .command("init")
    .summary("Create a worktree project and init a Git repository.\n\n")
    .description(
      `To create a worktree project that manages all git worktrees.  If the <directory> is not a git repository, it will create a new one via "git init".\n\n`
    )
    .option(
      "--branch [branch-name]",
      "(optional) The specified name for the initial branch in the newly created git repository.\n\n"
    )
    .helpOption("-h, --help", "Display help for command")
    .argument(
      "[directory]",
      "(optional) Specify a directory that the command is run inside it. The default is the current directory\n\n"
    )
    .action(action);
}
