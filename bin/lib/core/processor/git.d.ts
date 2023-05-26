declare function initRepository(context: any, next: CallableFunction): void;
declare function configWorktree(context: any, next: CallableFunction): void;
declare function addWorktree(context: any, next: CallableFunction): void;
declare function removeWorktree(context: any, next: CallableFunction): void;
declare function repairWorktree(context: any, next: CallableFunction): void;
declare const _default: {
    initRepository: typeof initRepository;
    repairWorktree: typeof repairWorktree;
    configWorktree: typeof configWorktree;
    addWorktree: typeof addWorktree;
    removeWorktree: typeof removeWorktree;
};
export default _default;
