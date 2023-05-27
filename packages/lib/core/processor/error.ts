import chalk from "chalk";
function captureError(context: any, next: CallableFunction) {
  try {
    next();
  } catch (error:any) {
    //TODO: To come up with a natty solution to show the error message
    
    console.log(chalk.bgRed.bold('error'))
    console.log(error.message)
  }
}

export default {
  captureError,
};
