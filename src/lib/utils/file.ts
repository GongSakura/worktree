import { mkdtempSync, readFileSync, rmdirSync, statSync } from "node:fs";
import * as path from "node:path";
import { PROJECT_FILES } from "./types";

export function getProjectFile(cwdPath: string, name: PROJECT_FILES) {
  try {
    return JSON.parse(readFileSync(path.resolve(cwdPath, name)).toString());
  } catch (error) {
    return {};
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
    console.info(`error:`, error);
    return true;
  } finally {
    rmdirSync(path);
  }
}
export function normalizePath(path: string) {
  if (global.isPathCaseSensitive) {
    return path;
  }
  return path.toLowerCase();
}
