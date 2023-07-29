import type { IContext, IProcessor } from "../types";

/**
 * middleware executor
 */
export default class Executer {
  private middlewares: IProcessor[];
  private isDone: boolean;
  constructor(middlewares: IProcessor[]) {
    this.middlewares = middlewares.reverse();
    this.isDone = false;
  }

  run(context: IContext = {} as IContext, done?: CallableFunction) {
    const next = async () => {
      if (this.middlewares.length) {
        const fn = this.middlewares.pop() as IProcessor;
        await fn(context, next);
      } else if (!this.isDone && done) {
        done();
        this.isDone = true;
      }
    };
    next();
  }
}
