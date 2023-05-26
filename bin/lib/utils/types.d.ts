export interface Processor {
    (context: any, next: CallableFunction): void;
}
export interface Workspace {
    path?: string;
    name?: string;
}
export interface CodeWorkSpaceConfig {
    folders: Workspace[];
}
export interface WorktreeConfig {
    path?: string;
}
export interface ProjectConfig {
    mainWorktreePath?: string;
    linkedWorktreePaths?: [];
}
export declare enum PROJECT_FILES {
    CODE_WORKSPACE = "wt.code-workspace",
    CONFIGURATION = "wt.config.json"
}
