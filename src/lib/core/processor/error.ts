function captureError(context: any, next: CallableFunction) {
  try {
    next();
  } catch (error) {
    //TODO: To come up with a natty solution to show the error message
    console.info(`error capture:\n`,error?.stderr?.toString());

  }
}

export default {
  captureError,
};
