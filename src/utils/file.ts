import { mkdtempSync, readFileSync, rmdirSync, statSync } from "node:fs";
import * as path from "node:path";
import { PROJECT_FILES, IProjectConfig } from "./types";


export function getProjectFile(cwdPath: string, name: PROJECT_FILES) {
  try {
    return JSON.parse(readFileSync(path.resolve(cwdPath, name)).toString());
  } catch {
    return {};
  }
}

/**
 * To return configuration, if the configuration is empty, then return undefined
 */
export function getConfigs(cwdPath: string): IProjectConfig|undefined {
  let curPath = cwdPath;
  let nextPath = path.dirname(cwdPath);

  while (nextPath !== curPath) {
    const config = getProjectFile(curPath, PROJECT_FILES.CONFIGURATION);
    if (Object.keys(config).length === 0) {
      curPath = nextPath;
      nextPath = path.dirname(curPath);
    } else {
      config.projectPath = curPath
      return config;
    }
  }
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
