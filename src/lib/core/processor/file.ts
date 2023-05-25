/**
 * Handle all file operations
 */

import {
  Stats,
  linkSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import * as path from "node:path";
import { CodeWorkSpace, PROJECT_FILES } from "../../utils/types";
import {
  checkArePathsIdentical,
  checkIsDirectChildPath,
  normalizePath,
} from "../../utils/file";

const IGNORE_FILES = new Set([".git", ".code-workpace"]);
/**
 * Move all files into a new directory named after the branch name
 */
function initDirectory(context: any, next: CallableFunction) {
  const gitDirPath = normalizePath(context.gitDir);
  const gitDirDirname = normalizePath(path.dirname(context.gitDir));

  // check if dirname of "git dir" is the mainWorktreePath,
  // if so to get the real main worktree path
  // Noted: operation must be in the main worktree
  const oldParentPath = normalizePath(context.cwd);
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

      const isGitDirSibling = !checkArePathsIdentical(
        oldParentPath,
        parentPath
      );

      const isGitDirOutside =
        parentPath !== gitDirDirname && parentPath.startsWith(gitDirDirname);

      if (isGitDirSibling) {
        renameSync(oldParentPath, newPath);
      } else {
        mkdirSync(newPath);
      }

      readdirSync(parentPath).forEach((file) => {
        const filePath = normalizePath(path.resolve(parentPath, file));

        if (!IGNORE_FILES.has(file) && !excludedPaths.has(filePath)) {
          renameSync(
            path.resolve(parentPath, file),
            path.resolve(newPath, file)
          );
        }
      });

      renameSync(gitDirPath, newPath + "/.git");

      if (isGitDirSibling || isGitDirOutside) {
        rmSync(parentPath + "/.git");
      }
    }
  }

  context.worktrees = newWorktrees;
  next();
}

function createProjectCodeWorkspace(context: any, next: CallableFunction) {
  const cwd = context.cwd;
  const codeWorkSpacePath = path.resolve(cwd, PROJECT_FILES.CODE_WORKSPACE);
  const codeWorkSpace = {} as CodeWorkSpace;
  codeWorkSpace.folders = context.worktrees.map((e) => {
    return {
      name: e[2],
      path: e[0],
    };
  });
  writeFileSync(codeWorkSpacePath, JSON.stringify(codeWorkSpace, null, 2), {
    mode: 0o777,
    encoding: "utf-8",
    flag: "w",
  });
  context.codeWorkspace = codeWorkSpace;
  next();
}

function updateProjectCodeWorkspace(context: any, next: CallableFunction) {
  const workspacePath = path.resolve(
    path.dirname(context.config.projectConfigPath),
    PROJECT_FILES.CODE_WORKSPACE
  );
  const workspaceFile = {} as CodeWorkSpace;

  workspaceFile.folders = context.worktrees.map((e) => {
    return {
      name: e[2],
      path: e[0],
    };
  });

  writeFileSync(workspacePath, JSON.stringify(workspaceFile), {
    mode: 0o777,
    encoding: "utf-8",
    flag: "w",
  });

  context.codeWorkspace = {
    path: workspacePath,
  };
  next();
}

function createProjectConfiguration(context: any, next: CallableFunction) {
  const cwd = context.cwd;
  const projectConfigPath = path.resolve(cwd, "wt.config.json");

  const v = context.worktrees.reduce((prev, cur) => {
    prev.push(cur[0]);
    return prev;
  }, []);

  const config = {
    mainWorktreePath: v.pop(),
    linkedWorktreePaths: v,
  };

  try {
    writeFileSync(projectConfigPath, JSON.stringify(config, null, 2), {
      mode: 0o777,
      encoding: "utf-8",
      flag: "w",
    });
  } catch (error) {
    console.info(`createConfiguration error:`, error);
  }

  context.config = {
    projectConfigPath,
  };
  next();
}

// FIXME: overwrite the configuration each time
function updateProjectConfiguration(context: any, next: CallableFunction) {
  const v = context.worktrees.reduce((prev, cur) => {
    prev.push(cur[0]);
    return prev;
  }, []);

  const config = {
    mainWorktreePath: v.pop(),
    linkedWorktreePaths: v,
  };

  writeFileSync(context.config.projectConfigPath, JSON.stringify(config), {
    mode: 0o777,
    encoding: "utf-8",
    flag: "w",
  });

  next();
}

export default {
  initDirectory,

  createProjectCodeWorkspace,
  updateProjectCodeWorkspace,

  createProjectConfiguration,
  updateProjectConfiguration,
};
