/**
 * Handle all file operations
 */

import {
  Stats,
  linkSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import * as path from "node:path";
import {
  ICodeWorkSpaceConfig,
  EPROJECT_FILES,
  EPROJECT_TYPE,
  IRepo,
  IContext,
} from "../../utils/types";
import {
  checkArePathsIdentical,
  checkIsDirectChildPath,
  normalizePath,
} from "../../utils/file";
import {
  checkIsWorktree,
  getCurrentBranch,
  getGitDir,
  getWorktrees,
} from "../../utils/git";
import { copySync, ensureDirSync, moveSync } from "fs-extra";
import { UNKNOWN_REPO } from "../../utils/constants";

const IGNORE_FILES = new Set([".git", ".code-workpace"]);

/**
 * Move all files into a new directory named after the branch name
 */
function initDirectory(context: IContext, next: CallableFunction) {
  context.repos?.forEach((repo: IRepo) => {
    // Noted: following operation must be in the main worktree

    // check if dirname of ".git" is the mainWorktreePath,
    // if so, then to get the real main worktree path
    const gitDirPath = normalizePath(repo.gitDir!);
    const gitDirDirname = normalizePath(path.dirname(repo.gitDir!));
    const oldParentPath = normalizePath(context.projectPath!);
    const parentPath = checkIsDirectChildPath(
      gitDirPath.replace(/\/.git$/, ""),
      oldParentPath
    )
      ? gitDirDirname
      : oldParentPath;

    const oldWorktrees = repo.worktrees!;
    const excludedPaths = new Set(
      oldWorktrees.map((e: string[]) => normalizePath(e[0]))
    );
    excludedPaths.add(gitDirPath);

    const newWorktrees: string[][] = [];

    const n = oldWorktrees.length;
    for (let i = 0; i < n; i++) {
      const [oldPath, commitHash, branch] = oldWorktrees[i];

      const newPath = normalizePath(
        path.resolve(
          parentPath,
          `${
            context.projectType === EPROJECT_TYPE.SINGLE
              ? branch
              : repo.name + path.sep + branch
          }`
        )
      );
      excludedPaths.add(newPath);
      newWorktrees.push([newPath, commitHash, branch]);

      // if the new worktree path is existed, then skip
      let newPathStat: Stats | undefined;
      try {
        newPathStat = statSync(newPath);
      } catch (error) {}
      if (newPathStat) {
        continue;
      }

      // hoist linked worktrees
      if (i < n - 1) {
        try {
          // FIXME: have not decided to use hardlink or directly move the linked worktrees
          // outside the current work directory
          newPath.startsWith(parentPath)
            ? moveSync(oldPath, newPath)
            : linkSync(oldPath, newPath);
        } catch (error) {
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
          moveSync(oldParentPath, newPath);
        } else {
          mkdirSync(newPath);
        }

        readdirSync(parentPath).forEach((file) => {
          const filePath = normalizePath(path.resolve(parentPath, file));

          if (!IGNORE_FILES.has(file) && !excludedPaths.has(filePath)) {
            moveSync(
              path.resolve(parentPath, file),
              path.resolve(newPath, file)
            );
          }
        });

        moveSync(gitDirPath, newPath + "/.git");

        // remove outside "/.git"
        if (isGitDirSibling || isGitDirOutside) {
          rmSync(parentPath + "/.git");
        }

        repo.gitDir = newPath + "/.git";
        repo.path = newPath;
      }
    }

    repo.worktrees = newWorktrees;
  });

  next();
}

function updateDirectory(context: IContext, next: CallableFunction) {
  

  let unknownRepo: IRepo | undefined = undefined;
  for (const [key, repo] of Object.entries(context.reposMap!)) {
    if (repo.name === UNKNOWN_REPO) {
      unknownRepo = repo;
      delete context.reposMap![UNKNOWN_REPO];
    } else {
      const renameTodoMap = new Map();
      const newWorktrees: string[][] = [];

      repo.worktrees?.forEach((worktree) => {
        const [oldPath, , branch] = worktree;
        const newPath = path.resolve(
          context.projectPath!,
          `${
            context.projectType === EPROJECT_TYPE.SINGLE
              ? branch
              : repo.name + path.sep + branch
          }`
        );
       
        if (repo.path === oldPath) {
          repo.path = newPath;
        } else {
          newWorktrees.push([newPath, "", branch]);
        }

        if (!checkArePathsIdentical(oldPath, newPath)) {
          renameTodoMap.set(oldPath, newPath);
        }
      });
      console.info(`renameTodoMap:`,renameTodoMap)
      while (renameTodoMap.size) {
        for (const [oldPath, newPath] of renameTodoMap.entries()) {
          if (renameTodoMap.has(newPath)) {
            continue;
          }
          try {
            moveSync(oldPath, newPath);
            renameTodoMap.delete(oldPath);
          } catch {}
        }
      }

      repo.worktrees = newWorktrees;
      delete context.reposMap![key];
      context.reposMap![repo.path!] = repo;
    }
  }

  if (unknownRepo) {
    const worktrees = unknownRepo.worktrees;
    const renameTodoMap = new Map();

    worktrees?.forEach((e) => {
      const oldPath = e[0];
      if (checkIsWorktree(oldPath)) {
        const gitDirPath = normalizePath(getGitDir(oldPath));
        const repoPath = gitDirPath.replace(/\/.git.*/, "");
        if (context?.reposMap?.hasOwnProperty(repoPath)) {
          const branch = getCurrentBranch(oldPath);
          if (oldPath.endsWith(path.normalize(branch))) {
            return;
          }
         
          const newPath = path.resolve(
            context.projectPath!,
            `${
              context.projectType === EPROJECT_TYPE.SINGLE
                ? branch
                : (context.reposMap[repoPath].name! + path.sep + branch)
            }`
          );
          console.info(`branch:`,branch)
          console.info(`oldPath:`,oldPath)
          console.info(`newPath:`,newPath)
          context.reposMap[repoPath].worktrees?.push([newPath, "", branch]);
          renameTodoMap.set(oldPath, newPath);
        }
      }
    });
    console.info(`renameTodoMap:`,renameTodoMap)
    while (renameTodoMap.size) {
      for (const [oldPath, newPath] of renameTodoMap.entries()) {
        if (renameTodoMap.has(newPath)) {
          continue;
        }
        try {
          moveSync(oldPath, newPath);
          renameTodoMap.delete(oldPath);
        } catch {}
      }
    }
  }

  context.repos = Object.values(context.reposMap || {});
  next();
}
function linkDirectory(context: IContext, next: CallableFunction) {
  if (
    !path.isAbsolute(context.command.arguments.repoURL) &&
    context.command.arguments.repoURL[0] !== "."
  ) {
    next();
  } else {
    let linkPath = path.resolve(context.command.arguments.repoURL);

    if (checkIsWorktree(linkPath)) {
      const worktree = getWorktrees(linkPath)[0];

      // link path should be the main worktree of a repository
      linkPath = worktree[0];
    } else {
      throw new Error("Cannot link to a non-git repository");
    }
    const currentBranch = getCurrentBranch(linkPath);
    const repo: IRepo = {
      name: context.command.arguments.repoName,
      path: path.resolve(
        context.projectPath!,
        `${context.command.arguments.repoName}${path.sep}${currentBranch}`
      ),
    };

    ensureDirSync(repo.path!);
    copySync(linkPath, repo.path!);
    repo.worktrees = [[repo.path!, "", currentBranch]];

    if (Array.isArray(context.repos)) {
      context.repos.push(repo);
    } else {
      context.repos = [repo];
    }
    next();
  }
}
function unlinkDirectory(context: IContext, next: CallableFunction) {
  const unlinkRepo = context.repos?.find(
    (_repo: IRepo) => _repo.name === context.command.arguments.repoName
  );
  const worktrees = getWorktrees(unlinkRepo?.path!);
  if (
    !checkArePathsIdentical(
      path.dirname(unlinkRepo?.path || ""),
      context.projectPath!
    )
  ) {
    rmSync(path.dirname(unlinkRepo?.path || ""), {
      force: true,
      recursive: true,
    });
  }

  worktrees.forEach((e) => {
    rmSync(e[0], {
      force: true,
      recursive: true,
    });
  });

  // prepare to write configuration
  const repos = context.repos?.filter(
    (_repo: IRepo) => _repo.name !== context.command.arguments.repoName
  );

  context.repos = repos;
  context.repos!.forEach((repo: IRepo) => {
    if (repo.path) {
      repo.worktrees = getWorktrees(repo.path).reverse();
    }
  });
  next();
}

function writeProjectCodeWorkspace(context: IContext, next: CallableFunction) {
  const codeWorkSpacePath = path.resolve(
    context.projectPath!,
    EPROJECT_FILES.CODE_WORKSPACE
  );

  const codeWorkSpace = { folders: [] } as ICodeWorkSpaceConfig;

  context.repos?.forEach((repo: IRepo) => {
    repo.worktrees?.forEach((e: string[]) => {
      codeWorkSpace.folders.push({
        name:
          context?.projectType === EPROJECT_TYPE.SINGLE
            ? e[2]
            : `${repo.name}${path.sep}${e[2]}`,
        path: e[0],
      });
    });
  });

  writeFileSync(codeWorkSpacePath, JSON.stringify(codeWorkSpace, null, 2), {
    mode: 0o777,
    encoding: "utf-8",
    flag: "w",
  });
  context.codeWorkspace = codeWorkSpace;
  next();
}

function writeProjectConfiguration(context: IContext, next: CallableFunction) {
  const projectConfigPath = path.resolve(
    context.projectPath!,
    EPROJECT_FILES.CONFIGURATION
  );

  const config = {
    repos: context.repos?.map((repo: IRepo) => {
      return { name: repo.name, path: repo.path };
    }),
    type: context.projectType || EPROJECT_TYPE.SINGLE,
  };
  writeFileSync(projectConfigPath, JSON.stringify(config, null, 2), {
    mode: 0o777,
    encoding: "utf-8",
    flag: "w",
  });

  context.config = {
    projectConfigPath,
  };
  next();
}

export default {
  initDirectory,
  updateDirectory,
  linkDirectory,
  unlinkDirectory,
  writeProjectCodeWorkspace,
  writeProjectConfiguration,
};
