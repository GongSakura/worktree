import { mkdtempSync, readFileSync, rmdirSync, statSync } from "node:fs";
import * as path from "node:path";
import { EPROJECT_FILES, IProjectConfig, IGitConfig } from "./types";
import { getGitConfiguration } from "./git";

export function getProjectFile(cwdPath: string, name: EPROJECT_FILES) {
  try {
    return JSON.parse(readFileSync(path.resolve(cwdPath, name)).toString());
  } catch {
    return {};
  }
}
export function getConfigs(cwdPath: string): [IProjectConfig, IGitConfig] {
  return [
    getProjectFile(cwdPath, EPROJECT_FILES.CONFIGURATION),
    getGitConfiguration(cwdPath),
  ];
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
    return true;
  } finally {
    rmdirSync(path);
  }
}

/**
 * normalize path by checking if it's caseSensitive
 * @param rawPath
 * @returns
 */
export function normalizePath(rawPath: string) {
  if ((global as any).isPathCaseSensitive) {
    return path.normalize(rawPath);
  }
  return path.normalize(rawPath.toLowerCase());
}

export function checkIsDir(cwdPath: string) {
  try {
    return statSync(cwdPath).isDirectory();
  } catch {
    return false;
  }
}
