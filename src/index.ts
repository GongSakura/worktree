import { Command } from "commander";
import { CommandCreator, ActionCreator } from "./lib/commands";
import { checkIsPathCaseSensitive } from "./lib/utils/file";
import { done } from "./lib/utils/action";

declare global {
  var isPathCaseSensitive: boolean;
}
global.isPathCaseSensitive = checkIsPathCaseSensitive();

const program = new Command();
program
  .name(`wt`)
  .version("0.1.0")
  .addHelpCommand("help [command]", "Show command details.\n\n")
  .addCommand(CommandCreator.create(ActionCreator.create(done)))
  .addCommand(CommandCreator.link(ActionCreator.link(done)))
  .addCommand(CommandCreator.unlink(ActionCreator.unlink(done)))
  .addCommand(CommandCreator.init(ActionCreator.init(done)))
  .addCommand(CommandCreator.clone(ActionCreator.clone(done)))
  .addCommand(CommandCreator.remove(ActionCreator.remove(done)))
  .addCommand(CommandCreator.add(ActionCreator.add(done)))
  .addCommand(CommandCreator.update(ActionCreator.update(done)));

program.parse(process.argv);
