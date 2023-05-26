import { PROJECT_FILES } from "./types";
export declare function getProjectFile(cwdPath: string, name: PROJECT_FILES): any;
export declare function checkIsDirectChildPath(parentPath: string, childPath: string): boolean;
export declare function checkArePathsIdentical(...paths: string[]): boolean;
export declare function checkIsPathCaseSensitive(): boolean;
export declare function normalizePath(path: string): string;
