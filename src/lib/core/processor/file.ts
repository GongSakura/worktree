/**
 * Handle all file operations
 */

import {
  Stats,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  renameSync,
  rmSync,
  rmdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import * as path from "node:path";
import type { CodeWorkSpaceJSON } from "../types";

const IGNORE_FILES = new Set([".git", ".code-workpace"]);
/**
 * Move all files into a new directory named after the branch name
 */
function initDirectory(context: any, next: CallableFunction) {
  const oldParentPath = context.commandArgumetns.directory;

  // check if ".git" is outside the mainWorktreePath,
  // if so to get the real main worktree path
  const parentPath = checkIsDirectChildPath(
    context.gitDir.replace(/\/.git$/, ""),
    oldParentPath
  )
    ? context.gitDir.replace(/\/.git$/, "")
    : oldParentPath;

  const oldWorkTrees = context.workTrees;
  const excludedPaths = new Set(oldWorkTrees.map((e) => e[0]));
  const newWorkTrees = [];

  const n = oldWorkTrees.length;
  for (let i = 0; i < n; i++) {
    const [oldPath, commitHash, branch] = oldWorkTrees[i];
    const newPath = path.resolve(parentPath, `_${branch}_`);

    // if new path is existed, then skip
    let newPathStat: Stats = null;
    try {
      newPathStat = statSync(newPath);
    } catch (error) {}

    if (newPathStat) {
      console.log("path exited, cannot move to ...");
      continue;
    }
    excludedPaths.add(newPath);
    // hoist linked worktrees
    if (i < n - 1) {
      try {
        // FIXME: have not decided to use hardlink or directly move the linked worktrees
        // outside the current work directory
        newPath.startsWith(parentPath)
          ? renameSync(oldPath, newPath)
          : linkSync(oldPath, newPath);
      } catch (error) {
        console.log("renameSync", error);
        break;
      }

      newWorkTrees.push([newPath, commitHash, branch]);
    } else {
      // deal with the main worktree
      // If the git dir is the sibling directory of the main worktree, then just rename,
      // and move the rest of files into the new directory.

      // E.g.
      //       sibling git dir path: "path/to/.git"
      //         main worktree path: "path/to/<main-worktree-branch>/*"
      // renamed main worktree path: "path/to/_<<main-worktree-branch>_/*")

      const isGitDirSibling = !checkArePathsIdentical(
        oldParentPath,
        parentPath
      );
      try {
        if (isGitDirSibling) {
          console.log("rename it");
          renameSync(oldParentPath, newPath);
        } else {
          mkdirSync(newPath);
        }

        readdirSync(parentPath).forEach((file) => {
          const filePath = path.resolve(parentPath, file);
          if (!IGNORE_FILES.has(file) && !excludedPaths.has(filePath)) {
            renameSync(
              path.resolve(parentPath, file),
              path.resolve(newPath, file)
            );
          }
        });

        renameSync(context.gitDir, newPath + "/.git");
        if (isGitDirSibling) {
          rmSync(parentPath + "/.git");
        }

        newWorkTrees.push([newPath, commitHash, branch]);
      } catch (error) {
        console.info(`readdirSync error:`, error);
        return;
      }
    }
  }
  context.workTrees = newWorkTrees;
  next();
}

function createCodeWorkSpace(context: any, next: CallableFunction) {
  const cwd = context.commandArgumetns.directory;
  // const workSpacePath = path.resolve(
  //   cwd,
  //   cwd.split("/").pop() + ".code-workspace"
  // );

  const workSpacePath = path.resolve(cwd, "_.code-workspace");
  const workSpaceFile = {} as CodeWorkSpaceJSON;

  workSpaceFile.folders = context.workTrees.map((e) => {
    return {
      name: e[2],
      path: e[0],
    };
  });
  try {
    writeFileSync(workSpacePath, JSON.stringify(workSpaceFile), {
      mode: 0o777,
      encoding: "utf-8",
      flag: "w",
    });
  } catch (error) {}
  context.workSpacePath = workSpacePath;
  next();
}
function createConfiguration(context: any, next: CallableFunction) {
  const cwd = context.commandArgumetns.directory;
  const configPath = path.resolve(cwd, "wt.config.json");
  const v = context.workTrees.reduce((prev, cur) => {
    prev.push(cur[0]);
    return prev;
  }, []);

  const config = {
    [v.pop()]: v,
  };

  try {
    writeFileSync(configPath, JSON.stringify(config), {
      mode: 0o777,
      encoding: "utf-8",
      flag: "w",
    });
  } catch (error) {
    console.info(`createConfiguration error:`, error);
  }
  context.configPath = configPath;

  next();
}

export function checkIsDirectChildPath(
  parentPath: string,
  childPath: string
): boolean {
  const parentDir = path.dirname(childPath);
  return checkArePathsIdentical(parentDir, parentPath);
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
    return stat.isDirectory();
  } catch (error) {
    return true;
  } finally {
    rmdirSync(path);
  }
}
export default {
  initDirectory,
  createCodeWorkSpace,
  createConfiguration,
};
