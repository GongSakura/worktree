import { WorktreeConfig } from "./types";
export declare function getWorktrees(cwdPath: string): [string, string, string][];
export declare function checkIsWorktree(cwdPath: string): boolean;
export declare function checkIsMainWorktree(cwdPath: string): boolean;
export declare function enableWorktreeConfig(cwdPath: string): boolean;
export declare function getWorktreeConfiguration(cwdPath: string): WorktreeConfig;
export declare function getGitDir(repoPath: string): string;
export declare function setGitDir(cwdPath: string, gitDirPath: string): void;
export declare function checkIsGitDir(cwdPath: string): boolean;
export declare function initBranch(repoPath: string): void;
export declare function getBranches(cwdPath: string): string[];
