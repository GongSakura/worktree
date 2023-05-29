import chalk from "chalk";

function captureError(context: any, next: CallableFunction) {
  try {
    next();
  } catch (error: any) {
    //TODO: To come up with a natty solution to show the error message
    console.log(`
  ${chalk.redBright.bold("✘ ERROR INFO:")}

    ${chalk.bold("::")} ${error.message}
    `);
  }
}

export default {
  captureError,
};
