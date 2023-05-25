import { initCommand,addCommand } from "./lib/commands";
import { Command } from "commander";

const main = new Command();

main
  .name("wt")
  .version("1.0.0")
  .addHelpCommand("help [command]", "Show command details")
  .addCommand(initCommand)
  .addCommand(addCommand);
main.parse(process.argv);
