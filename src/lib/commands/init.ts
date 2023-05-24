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
  checkIsPathCaseSensitive,
} from "../core";

export default new Command()
  .command("init")
  .summary("Initialize a multiple worktrees repository.\n\n")
  .description(
    `Initialize a multiple worktrees repository that leverages the workspace from VScode.\n\nThe options will be used in "git init".`
  )
  .option("--separate-git-dir [git-dir]")
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
      commandOptions: this.opts(),
      commandArgumetns: {
        directory: path.resolve(this.processedArgs[0]),
      },
    };

    global.isPathCaseSensitive = checkIsPathCaseSensitive();

    const processes = [
      GitProcessor.initRepository,
      FileProcessor.initDirectory,
      GitProcessor.repairWorktree,
      FileProcessor.createConfiguration,
      FileProcessor.createCodeWorkSpace,
      GitProcessor.configWorktree,
    ];
    const executer = new Executer(processes);
    executer.run(context, () => {
      console.log("DONE");
    });
  });
