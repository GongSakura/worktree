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

export default new Command()
  .command("rm")
  .aliases(["remove", "delete",])
  .summary("remove a linked worktree.\n")
  .description(`Remove a linked worktree`)
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
      CheckProcessor.checkAddPrerequisite,
      GitProcessor.removeWorktree,
      FileProcessor.updateProjectCodeWorkspace,
      FileProcessor.updateProjectConfiguration,
    ];
    const executer = new Executer(processes);
    executer.run(context,()=>{
      console.info(`done remove`)
    });
  });
