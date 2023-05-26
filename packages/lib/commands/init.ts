/**
 * ===================
 *   wt init <path>
 * ===================
 */
import * as path from "node:path";
import { Command } from "commander";
import {
  Executer,
  GitProcessor,
  FileProcessor,
  CheckProcessor,
  ErrorProcessor,
} from "../core";

export default new Command()
  .command("init")
  .aliases(["i"])
  .summary("Initialize a multiple worktrees repository.\n\n")
  .description(
    `Initialize a multiple worktrees repository that leverages the workspace from VScode.\n\nThe options will be used in "git init".`
  )
  .option(
    "--branch [branch-name]",
    ":: The specified name for the initial branch in the newly created repository.\n\n"
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
        arugments: {
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
    executer.run(context, () => {
      console.log("DONE");
    });
  });
