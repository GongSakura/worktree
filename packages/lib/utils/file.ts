import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmdirSync,
  statSync,
} from "node:fs";
import * as path from "node:path";
import { PROJECT_FILES, ProjectConfig, WorktreeConfig } from "./types";
import { getWorktreeConfiguration } from "./git";

export function getProjectFile(cwdPath: string, name: PROJECT_FILES) {
  try {
    return JSON.parse(readFileSync(path.resolve(cwdPath, name)).toString());
  } catch (error) {
    return {};
  }
}
export function getConfigs(cwdPath: string): [ProjectConfig, WorktreeConfig] {
  const projectConfig: ProjectConfig = getProjectFile(
    cwdPath,
    PROJECT_FILES.CONFIGURATION
  );
  let worktreeConfig: WorktreeConfig = {};
  if (!projectConfig.mainWorktreePath) {
    worktreeConfig = getWorktreeConfiguration(cwdPath);
    if (!worktreeConfig.path) {
      throw new Error("Current working directory has not been initialized");
    }
  }
  return [projectConfig, worktreeConfig];
}

export function checkIsDirectChildPath(
  parentPath: string,
  childPath: string
): boolean {
  const parentDir = path.dirname(childPath);
  return checkArePathsIdentical(parentPath, parentDir);
}
export function checkArePathsIdentical(...paths: string[]): boolean {
  let flag;
  for (const p of paths) {
    try {
      const stat = statSync(p);
      if (!flag) {
        flag = stat.ino;
      } else if (stat.ino !== flag) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}
export function checkIsPathCaseSensitive() {
  const path = mkdtempSync("_");
  try {
    const stat = statSync(path.toUpperCase());
    return !stat.isDirectory();
  } catch (error) {
    console.info(`error:`, error);
    return true;
  } finally {
    rmdirSync(path);
  }
}
export function normalizePath(path: string) {
  if ((global as any).isPathCaseSensitive) {
    return path;
  }
  return path.toLowerCase();
}
