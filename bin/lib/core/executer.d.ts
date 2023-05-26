import type { Processor } from "../utils/types";
/**
 * middleware executor
 */
export default class Executer {
    private inputs;
    private isDone;
    constructor(inputs: Processor[]);
    run(context?: any, done?: CallableFunction): void;
}
