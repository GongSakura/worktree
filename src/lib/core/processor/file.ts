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
  const gitDirPath = normalizePath(context.gitDir);
  const gitDirDirname = normalizePath(path.dirname(context.gitDir));

  const oldParentPath = normalizePath(context.cwd);
  console.info(`oldParentPath:`, oldParentPath);
  // check if dirname of "git dir" is the mainWorktreePath,
  // if so to get the real main worktree path
  // Noted: operation must be in the main worktree
  const parentPath = checkIsDirectChildPath(
    gitDirPath.replace(/\/.git$/, ""),
    oldParentPath
  )
    ? gitDirDirname
    : oldParentPath;

  const oldWorktrees = context.worktrees;
  const excludedPaths = new Set(oldWorktrees.map((e) => normalizePath(e[0])));
  excludedPaths.add(gitDirPath);

  const newWorktrees = [];

  const n = oldWorktrees.length;

  for (let i = 0; i < n; i++) {
    const [oldPath, commitHash, branch] = oldWorktrees[i];
    const newPath = normalizePath(path.resolve(parentPath, branch));
    excludedPaths.add(newPath);
    newWorktrees.push([newPath, commitHash, branch]);

    // if new path is existed, then skip
    let newPathStat: Stats = null;
    try {
      newPathStat = statSync(newPath);
    } catch (error) {}

    if (newPathStat) {
      console.log("path exited, cannot move to ...");
      continue;
    }

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
    } else {
      // deal with the main worktree
      // If the git dir is the sibling directory of the main worktree, then just rename,
      // and move the rest of files into the new directory.

      // E.g.
      //       sibling git dir path: "path/to/.git"
      //         main worktree path: "path/to/<main-worktree-branch>/*"
      // renamed main worktree path: "path/to/_<<main-worktree-branch>_/*")
      //
      console.info(`excludedPaths:`, excludedPaths);
      const isGitDirSibling = !checkArePathsIdentical(
        oldParentPath,
        parentPath
      );

      const isGitDirOutside =
        parentPath !== gitDirDirname && parentPath.startsWith(gitDirDirname);

      try {
        if (isGitDirSibling) {
          renameSync(oldParentPath, newPath);
        } else {
          mkdirSync(newPath);
        }

        readdirSync(parentPath).forEach((file) => {
          const filePath = normalizePath(path.resolve(parentPath, file));
          console.info(`file:`, filePath);
          if (!IGNORE_FILES.has(file) && !excludedPaths.has(filePath)) {
            renameSync(
              path.resolve(parentPath, file),
              path.resolve(newPath, file)
            );
          }
        });
        console.info(`oldParentPath:`, oldParentPath);
        console.info(`parentPath/cwd:`, parentPath);
        console.info(`gitDirDirname:`, gitDirDirname);

        console.info(`gitDirPath:`, gitDirPath);
        console.info(`newPath:`, newPath);
        console.info(`isGitDirOutside:`, isGitDirOutside);
        renameSync(gitDirPath, newPath + "/.git");

        if (isGitDirSibling || isGitDirOutside) {
          rmSync(parentPath + "/.git");
        }

  
      } catch (error) {
        console.info(`readdirSync error:`, error);
        return;
      }
    }
  }

  context.worktrees = newWorktrees;
  next();
}

function createCodeWorkspace(context: any, next: CallableFunction) {
  const cwd = context.cwd;
  const workSpacePath = path.resolve(cwd, "wt.code-workspace");
  const workSpaceFile = {} as CodeWorkSpaceJSON;

  workSpaceFile.folders = context.worktrees.map((e) => {
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

  context.codeWorkspace = {
    path: workSpacePath,
  };
  next();
}

function updateCodeWorkspace(context: any, next: CallableFunction) {
  const workspacePath = path.resolve(
    path.dirname(context.config.path),
    "wt.code-workspace"
  );
  const workspaceFile = {} as CodeWorkSpaceJSON;

  workspaceFile.folders = context.worktrees.map((e) => {
    return {
      name: e[2],
      path: e[0],
    };
  });
  try {
    writeFileSync(workspacePath, JSON.stringify(workspaceFile), {
      mode: 0o777,
      encoding: "utf-8",
      flag: "w",
    });
  } catch (error) {}

  context.codeWorkspace = {
    path: workspacePath,
  };
  next();
}

function createConfiguration(context: any, next: CallableFunction) {
  const cwd = context.cwd;
  const configPath = path.resolve(cwd, "wt.config.json");

  const v = context.worktrees.reduce((prev, cur) => {
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

  context.config = {
    path: configPath,
  };
  next();
}

// FIXME: overwrite the configuration each time
function updateConfiguration(context: any, next: CallableFunction) {
  const configPath = context.config.path;
  const v = context.worktrees.reduce((prev, cur) => {
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
  next();
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
export default {
  initDirectory,

  createCodeWorkspace,
  updateCodeWorkspace,

  createConfiguration,
  updateConfiguration,
};
