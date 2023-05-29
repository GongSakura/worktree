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
  .summary("Add a new linked worktree.\n")
  .description(
    `Create a linked worktree and checkout [commit-hash] into it. The command "git worktree add --checkout -b <new-branch> <path> <commit-hash>" is executed inside, and <path> has already been taken care.\n\nFor more details see https://git-scm.com/docs/git-worktree.`
  )
  .option(
    "--base <commit-hash>",
    "If you want to log messages in two columns in the console, you can achieve this by formatting your log messages using tabs or fixed-width spacing. Here's an example of how you can achieve it"
    // ":: A base for the linked worktree, <commit-hash> can be a branch name or a commit hash.\n\n"
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

    const processes = [
      ErrorProcessor.captureError,
      CheckProcessor.checkAddPrerequisite,
      GitProcessor.addWorktree,
      FileProcessor.updateProjectCodeWorkspace,
    ];
    const executer = new Executer(processes);
    executer.run(context, () => {
      process.stdout.write(`  ${chalk.greenBright.bold(`✔ DONE`)}\n`);
    });
  });
