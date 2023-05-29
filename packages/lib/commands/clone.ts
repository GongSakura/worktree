/**
 * TODO: handle "git clone"
 */

/**
 * =============================
 *   wt clone <repo> <directory>
 * =============================
 */
import * as path from "path";
import { Command } from "commander";
import {
  Executer,
  GitProcessor,
  FileProcessor,
  CheckProcessor,
  ErrorProcessor,
} from "../core";
import chalk from "chalk";

export default new Command()
  .command("clone")
  .summary("Clone and initialize\n\n")
  .description(
    `Clone a git repository, and initialize it as a multiple worktrees project.\n\n`
  )
  .argument("<repo>", "The url of a git repository.")
  .argument(
    "[directory]",
    "Specify a directory that the command is run inside it.",
    process.cwd()
  )
  .action(function () {
    const context = {
      command: {
        arguments: {
          repoURL: this.processedArgs[0],
          directory: path.resolve(this.processedArgs[1]),
        },
      },
      cwd: path.resolve(this.processedArgs[1]),
    };

    const processes = [
      ErrorProcessor.captureError,
      CheckProcessor.checkClonePrerequisite,
      GitProcessor.cloneRepository,
      FileProcessor.initDirectory,
      FileProcessor.createProjectConfiguration,
      FileProcessor.createProjectCodeWorkspace,
      GitProcessor.configWorktree,
    ];

    const executer = new Executer(processes);
    executer.run(context, () => {
      console.log(`
${chalk.cyanBright.bold(`✔ DONE:`)}

  ${chalk.bold("::")} ${`wt clone ${context.command.arguments.repoURL}`}
      `);
    });
  });
