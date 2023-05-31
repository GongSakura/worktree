import { Command } from "commander";
import {
  initCommand,
  addCommand,
  removeCommand,
  updateCommand,
  cloneCommand,
  createCommand,
  linkCommand,
  unlinkCommand
} from "./lib/commands";
import { checkIsPathCaseSensitive } from "./lib/utils/file";

declare global {
  var isPathCaseSensitive: boolean;
}
global.isPathCaseSensitive = checkIsPathCaseSensitive();

const main = new Command();
main
  .name(`wt`)
  .version("0.1.0")
  .addHelpCommand("help [command]", "Show command details.\n\n")
  .addCommand(createCommand)
  .addCommand(initCommand)
  .addCommand(linkCommand)
  .addCommand(unlinkCommand)
  .addCommand(cloneCommand)
  .addCommand(addCommand)
  .addCommand(removeCommand)
  .addCommand(updateCommand);
main.parse(process.argv);
