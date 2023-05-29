/**
 * Handle "git worktree remove"
 */

/**
 * =============================================
 *   wt remove -f <branch-name>
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
  .command("rm")
  .aliases(["remove", "delete"])
  .summary("Remove a linked worktree.\n\n")
  .description(`To remove a linked worktree from the worktree project`)
  .option(
    "-f, --force",
    `:: Remove both the branch and the linked worktree, if the branch isn't linked to any worktree, it will just remove the branch by "git branch -D <branch-name>" \n\n`
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
      CheckProcessor.checkRemovePrerequisite,
      GitProcessor.removeWorktree,
      FileProcessor.updateProjectCodeWorkspace,
    ];
    const executer = new Executer(processes);
    executer.run(context, () => {
      process.stdout.write(`  ${chalk.greenBright.bold(`✔ DONE`)}\n`);
    });
  });
