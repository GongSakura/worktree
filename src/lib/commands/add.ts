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
  checkIsPathCaseSensitive,
} from "../core";

export default new Command()
  .command("add")
  .summary("Add a new linked worktree.\n")
  .description(
    `Create a linked worktree and checkout [commit-hash] into it. The command "git worktree add --checkout -b <new-branch> <path> <commit-hash>" is executed inside, and <path> has already been taken care.\n\nFor more details see https://git-scm.com/docs/git-worktree.`
  )
  .option(
    "--base <commit-hash>",
    ":: A base for the linked worktree, <commit-hash> can be a branch name or a commit hash.\n\n"
  )
  .helpOption("-h, --help", "Display help for command")
  .argument(
    "<branch-name>",
    ":: If the branch doesn't existed, then create a new branch based on HEAD."
  )
  .action(function () {
    const context = {
      command: {
        options: this.opts(),
        arguments: {
          branchName: this.processedArgs[0],
        },
      },
      cwd: process.cwd(),
    };
    global.isPathCaseSensitive = checkIsPathCaseSensitive();

    const processes = [
      GitProcessor.addWorktree,
      GitProcessor.configWorktree,
      FileProcessor.updateCodeWorkspace,
      FileProcessor.updateConfiguration,
    ];
    const executer = new Executer(processes);
    executer.run(context);
  });
