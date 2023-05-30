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
import chalk from "chalk";

export default new Command()
  .command("add")
  .summary("Create a linked worktree.\n\n")
  .description(
    `Create a linked worktree which used the <branch-name> as the worktree directory name, and checkout [commit-hash] into it. The command "git worktree add --checkout -b <new-branch> <path> <commit-hash>" is executed inside, and <path> has already been taken care.\n\nFor more details see https://git-scm.com/docs/git-worktree.`
  )
  .option(
    "--repo <repo-name>",
    "When create a linked worktree in a multi-repos worktree project, it should be specified.\n\n"
  )
  .option(
    "--base <commit-hash>",
    ":: A base for the linked worktree, <commit-hash> can be a branch name or a commit hash.\n\n"
  )
  .helpOption("-h, --help", "Display help for command")
  .argument(
    "[branch-name]",
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

    const processes = [
      ErrorProcessor.captureError,
      CheckProcessor.checkAddPrerequisite,
      GitProcessor.addWorktree,
      FileProcessor.writeProjectCodeWorkspace,
    ];
    const executer = new Executer(processes);
    executer.run(context, () => {
      process.stdout.write(`  ${chalk.greenBright.bold(`✔ DONE`)}\n`);
    });
  });
