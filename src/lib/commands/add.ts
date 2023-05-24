/**
 * =========================
 *   wt add <branch-name>
 * =========================
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
  .command("add")
  .summary("Add a new linked worktree.\n\n")
  .description(
    ``
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
      FileProcessor.createWorkSpace,
      GitProcessor.repairWorktree
    ];
    const executer = new Executer(processes);
    executer.run(context);
  });
