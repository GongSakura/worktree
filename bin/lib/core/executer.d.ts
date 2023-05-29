import type { IProcessor } from "../utils/types";
/**
 * middleware executor
 */
export default class Executer {
    private inputs;
    private isDone;
    constructor(inputs: IProcessor[]);
    run(context?: any, done?: CallableFunction): void;
}
