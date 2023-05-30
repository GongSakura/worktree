import { Command } from "commander";
import * as path from "path";
import { CheckProcessor, ErrorProcessor, Executer, FileProcessor } from "../core";
import chalk from "chalk";

export default new Command()
  .name("create")
  .alias('c')
  .summary("Create an empty worktree project")
  .description("To create an empty worktree project that used for multiple git repositories")
  .argument(
    "[directory]",
    "Specify a directory that the command is run inside it.",
    process.cwd()
  )
  .action(function () {
    const context = {
      command: {
        arguments: {
          directory: path.resolve(this.processedArgs[0]),
        },
      },
      cwd: path.resolve(this.processedArgs[0]),
    };

 
    const processes = [
      ErrorProcessor.captureError,
      CheckProcessor.checkCreatePrerequisite,
      FileProcessor.writeProjectCodeWorkspace,
      FileProcessor.writeProjectConfiguration,
    ]
    const executer = new Executer(processes);
    executer.run(context, () => {
      process.stdout.write(`  ${chalk.greenBright.bold(`✔ DONE`)}\n`);
    });
  });

