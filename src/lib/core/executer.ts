import type { Processor } from "../utils/types";


/**
 * middleware executor
 */
export default class Executer {
  private inputs: Processor[];
  private isDone: boolean;
  constructor(inputs: Processor[]) {
    this.inputs = inputs.reverse();
    this.isDone = false;
  }

  run(context: any = {}, done?: CallableFunction) {
    const next = () => {
      if (this.inputs.length) {
        const fn = this.inputs.pop();
        fn(context, next);
      } else if (!this.isDone && done) {
        done();
        this.isDone = true;
      }
    };
    next();
  }
}
