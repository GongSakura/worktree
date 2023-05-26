function captureError(context: any, next: CallableFunction) {
  try {
    next();
  } catch (error:any) {
    //TODO: To come up with a natty solution to show the error message
    
    console.info(`error capture:\n`,error?.stderr?.toString());
    console.info(`error:`,error)
  }
}

export default {
  captureError,
};
