/**
 * Handle all file operations
 */
/**
 * Move all files into a new directory named after the branch name
 */
declare function initDirectory(context: any, next: CallableFunction): void;
declare function createProjectCodeWorkspace(context: any, next: CallableFunction): void;
declare function updateProjectCodeWorkspace(context: any, next: CallableFunction): void;
declare function createProjectConfiguration(context: any, next: CallableFunction): void;
declare function updateProjectConfiguration(context: any, next: CallableFunction): void;
declare const _default: {
    initDirectory: typeof initDirectory;
    createProjectCodeWorkspace: typeof createProjectCodeWorkspace;
    updateProjectCodeWorkspace: typeof updateProjectCodeWorkspace;
    createProjectConfiguration: typeof createProjectConfiguration;
    updateProjectConfiguration: typeof updateProjectConfiguration;
};
export default _default;
