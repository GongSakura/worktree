declare function checkInitPrerequisite(context: any, next: CallableFunction): void;
declare function checkAddPrerequisite(context: any, next: CallableFunction): void;
declare function checkRemovePrerequisite(context: any, next: CallableFunction): void;
declare const _default: {
    checkInitPrerequisite: typeof checkInitPrerequisite;
    checkAddPrerequisite: typeof checkAddPrerequisite;
    checkRemovePrerequisite: typeof checkRemovePrerequisite;
};
export default _default;
