import { initCommand,addCommand,removeCommand } from "./lib/commands";
import { Command } from "commander";

const main = new Command();

main
  .name("wt")
  .version("1.0.0")
  .addHelpCommand("help [command]", "Show command details")
  .addCommand(initCommand)
  .addCommand(addCommand)
  .addCommand(removeCommand);
main.parse(process.argv);
