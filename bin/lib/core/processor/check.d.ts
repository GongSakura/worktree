declare function checkInitPrerequisite(context: any, next: CallableFunction): void;
declare function checkClonePrerequisite(context: any, next: CallableFunction): void;
declare function checkAddPrerequisite(context: any, next: CallableFunction): void;
declare function checkRemovePrerequisite(context: any, next: CallableFunction): void;
declare function checkUpdatePrerequisite(context: any, next: CallableFunction): void;
declare function inspectPotentialWorktrees(context: any, next: CallableFunction): void;
declare const _default: {
    checkInitPrerequisite: typeof checkInitPrerequisite;
    checkClonePrerequisite: typeof checkClonePrerequisite;
    checkAddPrerequisite: typeof checkAddPrerequisite;
    checkRemovePrerequisite: typeof checkRemovePrerequisite;
    checkUpdatePrerequisite: typeof checkUpdatePrerequisite;
    inspectPotentialWorktrees: typeof inspectPotentialWorktrees;
};
export default _default;
