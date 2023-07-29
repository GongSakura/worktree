/**
 * =============================================
 *   wt add --base <commit-hash> <branch-name>
 * =============================================
 */

import { Command } from "commander";
import {
  Executer,
  GitProcessor,
  FileProcessor,
  ErrorProcessor,
  CheckProcessor,
} from "../core";

export function addAction(done: CallableFunction) {
  return function () {
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
      CheckProcessor.checkAddPrerequisite,
      GitProcessor.addWorktree,
      FileProcessor.writeProjectCodeWorkspace,
    ];
    const executer = new Executer(processes);
    executer.run(context, done);
  };
}

export function addCommand(action: (...args: any[]) => void) {
  return new Command()
    .command("add")
    .summary("Create a linked worktree.\n\n")
    .description(
      `Create a linked worktree which used the <branch-name> as the worktree directory name, and checkout [commit-hash] into it. The command "git worktree add --checkout -b <new-branch> <path> <commit-hash>" is executed inside, and <path> has already been taken care.\n\nFor more details see https://git-scm.com/docs/git-worktree.`
    )
    .option(
      "--repo <repo-name>",
      "(required) When create a linked worktree in a multi-repos worktree project, it should be specified.\n\n"
    )
    .option(
      "--base <commit-hash>",
      "(required) A base for the linked worktree, <commit-hash> can be a branch name or a commit hash.\n\n"
    )
    .helpOption("-h, --help", "Display help for command")
    .argument(
      "[branch-name]",
      "(optional) If the branch doesn't existed, then create a new branch based on HEAD."
    )
    .action(action);
}
