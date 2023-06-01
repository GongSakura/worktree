import type { IContext, IProcessor } from "../utils/types";

/**
 * middleware executor
 */
export default class Executer {
  private inputs: IProcessor[];
  private isDone: boolean;
  constructor(inputs: IProcessor[]) {
    this.inputs = inputs.reverse();
    this.isDone = false;
  }

  run(context: IContext = {} as IContext, done?: CallableFunction) {
    const next = () => {
      if (this.inputs.length) {
        const fn = this.inputs.pop() as IProcessor;
        fn(context, next);
      } else if (!this.isDone && done) {
        done();
        this.isDone = true;
      }
    };
    next();
  }
}
