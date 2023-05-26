import { ProjectConfig, WorktreeConfig } from "../../utils/types";
declare function checkInitPrerequisite(context: any, next: CallableFunction): void;
declare function checkAddPrerequisite(context: any, next: CallableFunction): void;
declare function checkRemovePrerequisite(context: any, next: CallableFunction): void;
declare function checkUpdatePrerequisite(context: any, next: CallableFunction): void;
export declare function getConfig(cwdPath: string): [ProjectConfig, WorktreeConfig];
declare const _default: {
    checkInitPrerequisite: typeof checkInitPrerequisite;
    checkAddPrerequisite: typeof checkAddPrerequisite;
    checkRemovePrerequisite: typeof checkRemovePrerequisite;
    checkUpdatePrerequisite: typeof checkUpdatePrerequisite;
};
export default _default;
