/**
 * =======================
 *   wt init <directory>
 * =======================
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
  .command("init")
  .summary("Create a worktree project and init a Git repository.\n\n")
  .description(
    `To create a worktree project that manages all git worktrees.  If the <directory> is not a git repository, it will create a new one via "git init\n\n".`
  )
  .option(
    "--branch [branch-name]",
    ":: The specified name for the initial branch in the newly created git repository.\n\n"
  )
  .helpOption("-h, --help", "Display help for command")
  .argument(
    "[directory]",
    "Specify a directory that the command is run inside it.",
    process.cwd()
  )
  .action(function () {
    const context = {
      command: {
        options: this.opts(),
        arguments: {
          directory: path.resolve(this.processedArgs[0]),
        },
      },
      cwd: path.resolve(this.processedArgs[0]),
    };

    const processes = [
      ErrorProcessor.captureError,
      CheckProcessor.checkInitPrerequisite,
      GitProcessor.initRepository,
      FileProcessor.initDirectory,
      GitProcessor.repairWorktree,
      FileProcessor.createProjectConfiguration,
      FileProcessor.createProjectCodeWorkspace,
      GitProcessor.configWorktree,
    ];

    const executer = new Executer(processes);
    executer.run(context,() => {
      process.stdout.write(`  ${chalk.greenBright.bold(`✔ DONE`)}\n`);
    });
  });
