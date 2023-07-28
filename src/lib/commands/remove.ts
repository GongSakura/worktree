/**
 * ===============================
 *   wt remove -f <branch-name>
 * ===============================
 */
import { Command } from "commander";
import {
  Executer,
  GitProcessor,
  FileProcessor,
  ErrorProcessor,
  CheckProcessor,
} from "../core";

export function removeAction(done: CallableFunction) {
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
      CheckProcessor.checkRemovePrerequisite,
      GitProcessor.removeWorktree,
      FileProcessor.writeProjectCodeWorkspace,
    ];
    const executer = new Executer(processes);
    executer.run(context, done);
  };
}
export function removeCommand(action: (...args: any[]) => void) {
  return new Command()
    .command("remove")
    .summary("Remove a linked worktree.\n\n")
    .description(`To remove a linked worktree from the worktree project.\n\n`)
    .option(
      "-f, --force",
      `:: Remove both the branch and the linked worktree, if the branch isn't linked to any worktree, it will just remove the branch by "git branch -D <branch-name>". \n\n`
    )
    .option(
      "--repo <repo-name>",
      "(required) When remove a linked worktree in a multi-repos worktree project, it should be specified. The <repo-name> can be an alias.\n\n"
    )
    .helpOption("-h, --help", "Display help for command")
    .argument(
      "[branch-name]",
      "(optional) If the branch name is not specified, then it will prompt the options."
    )
    .action(action);
}
