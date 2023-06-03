// import chalk from "chalk";
import chalk from "chalk";
import { IContext } from "../../utils/types";

function captureError(context: IContext, next: CallableFunction) {
  try {
    next();
  } catch (error: any) {
    //TODO: To come up with a natty solution to show the error message
    process.stderr.write(`
  ${chalk.redBright.bold("✘ ERROR:")}

    ${chalk.bold("::")} ${error.message}\n\n`);
  }
}

export default {
  captureError,
};
