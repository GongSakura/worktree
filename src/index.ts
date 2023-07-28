import { Command } from "commander";
import { CommandFactory, ActionFactory } from "./lib/commands";
import { checkIsPathCaseSensitive } from "./lib/utils/file";
import { done } from "./lib/utils/action";

declare global {
  var isPathCaseSensitive: boolean;
}
global.isPathCaseSensitive = checkIsPathCaseSensitive();

const program = new Command();
program
  .name(`wt`)
  .version("0.1.7")
  .addHelpCommand("help [command]", "Show command details.\n\n")
  .addCommand(CommandFactory.create(ActionFactory.create(done)))
  .addCommand(CommandFactory.link(ActionFactory.link(done)))
  .addCommand(CommandFactory.unlink(ActionFactory.unlink(done)))
  .addCommand(CommandFactory.init(ActionFactory.init(done)))
  .addCommand(CommandFactory.clone(ActionFactory.clone(done)))
  .addCommand(CommandFactory.remove(ActionFactory.remove(done)))
  .addCommand(CommandFactory.add(ActionFactory.add(done)))
  .addCommand(CommandFactory.update(ActionFactory.update(done)));

program.parse(process.argv);
