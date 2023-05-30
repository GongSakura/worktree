import { Command } from "commander";
import {
  initCommand,
  addCommand,
  removeCommand,
  updateCommand,
  cloneCommand,
} from "./lib/commands";
import { checkIsPathCaseSensitive } from "./lib/utils/file";

declare global {
  var isPathCaseSensitive: boolean;
}
global.isPathCaseSensitive = checkIsPathCaseSensitive();

const main = new Command();
main
  .name(`wt`)
  .version("1.0.0")
  .addHelpCommand("help [command]", "Show command details.\n\n")
  .addCommand(initCommand)
  .addCommand(cloneCommand)
  .addCommand(addCommand)
  .addCommand(removeCommand)
  .addCommand(updateCommand)
main.parse(process.argv);
