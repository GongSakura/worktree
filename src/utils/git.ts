import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { IGitConfig, GIT_CONFIG, IRepo } from "../types";
import { checkIsDir, normalizePath } from "./file";
import { UNKNOWN_REPO } from "./constants";

export function getWorktrees(cwdPath: string): string[][] {
  const worktrees: string[][] = [];
  execSync("git worktree list", {
    cwd: cwdPath,
    stdio: "pipe",
  })
    .toString()
    .trim()
    .split("\n")
    .forEach((e) => {
      const match = e.trim().match(/^(\S+)\s+(\w+)\s+(\[[^\]]+\])$/);
      if (match) {
        const [, worktreePath, commitHash, branch] = match;
        worktrees.push([
          worktreePath,
          commitHash,
          branch.replace(/\[(.*?)\]/g, "$1"),
        ]);
      }
    });
  return worktrees;
}
export function checkIsWorktree(cwdPath: string): boolean {
  try {
    const output = execSync("git rev-parse --is-inside-work-tree ", {
      cwd: cwdPath,
      stdio: "pipe",
    });
    return output.toString() ? true : false;
  } catch {
    return false;
  }
}
export function checkIsMainWorktree(cwdPath: string): boolean {
  try {
    return !execSync("git rev-parse --absolute-git-dir", {
      cwd: cwdPath,
      stdio: "pipe",
    })
      .toString()
      .trim()
      .includes(".git/worktree/");
  } catch (error: unknown) {
    return false;
  }
}

export function getGitConfig(cwdPath: string): IGitConfig {
  const config: IGitConfig = {};
  const properties = new Set();
  try {
    const stdout = execSync("git config --local --list", {
      cwd: cwdPath,
      stdio: "pipe",
    });
    stdout
      .toString()
      .trim()
      .split("\n")
      .forEach((e) => {
        const [k, v] = e.split("=");
        if (!properties.has(k)) {
          properties.add(k);
          if (k === GIT_CONFIG.PATH) {
            config.path = v;
          } else if (k === GIT_CONFIG.REPONAME) {
            config.reponame = v;
          }
        }
      });
  } finally {
    return config;
  }
}

export function getGitDir(repoPath: string): string {
  try {
    const output = execSync("git rev-parse --absolute-git-dir ", {
      cwd: repoPath,
      stdio: "pipe",
    });
    return output.toString().trim();
  } catch (error) {
    return "";
  }
}
export function setGitDir(cwdPath: string, gitDirPath: string) {
  try {
    execSync("git init --separate-git-dir=" + gitDirPath, {
      cwd: cwdPath,
      stdio: "pipe",
    });
  } catch {}
}

export function checkIsGitDir(cwdPath: string): boolean {
  try {
    const output = execSync("git rev-parse --is-inside-git-dir ", {
      cwd: cwdPath,
      stdio: "pipe",
    })
      .toString()
      .trim();

    return output === "true";
  } catch (error) {
    return false;
  }
}

export function initBranch(repoPath: string) {
  execSync("echo > README.md", {
    cwd: repoPath,
    stdio: "pipe",
  });
  execSync("git add README.md", {
    cwd: repoPath,
    stdio: "pipe",
  });
  execSync('git commit -m"Initial commit"', {
    cwd: repoPath,
    stdio: "pipe",
  });
}
export function getCurrentBranch(cwdPath: string) {
  try {
    return execSync("git branch --show-current", {
      cwd: cwdPath,
      stdio: "pipe",
    })
      .toString()
      .trim();
  } catch {
    return "";
  }
}
export function getAllBranches(cwdPath: string): string[] {
  try {
    const branches: string[] = [];
    execSync("git branch -a", {
      cwd: cwdPath,
      stdio: "pipe",
    })
      .toString()
      .trim()
      .split("\n")
      .forEach((e) => {
        const branch = e.trim().replace(/^\W*/, "");
        // skip e.g. "remotes/origin/HEAD -> origin/master",
        if (branch && !/.*->.*/.test(branch)) {
          branches.push(branch);
        }
      });
    return branches;
  } catch (error) {
    return [];
  }
}

export function getLocalBranches(cwdPath: string): string[] {
  try {
    const branches: string[] = [];
    execSync("git branch -l", {
      cwd: cwdPath,
      stdio: "pipe",
    })
      .toString()
      .trim()
      .split("\n")
      .forEach((e) => {
        const branch = e.trim().replace(/^\W*/, "");
        if (branch) {
          branches.push(branch);
        }
      });
    return branches;
  } catch (error) {
    return [];
  }
}
export function getUncheckoutBranches(cwdPath: string): string[] {
  try {
    const allBranches: Set<string> = new Set();
    const checkoutBranches: Set<string> = new Set();
    execSync("git branch -a", {
      cwd: cwdPath,
      stdio: "pipe",
    })
      .toString()
      .trim()
      .split("\n")
      .forEach((e) => {
        if (!/.*->.*/.test(e.trim())) {
          allBranches.add(e.trim().replace(/^\W*/, ""));
          if (/^[*+]/.test(e.trim())) {
            checkoutBranches.add(e.trim().replace(/^\W*/, ""));
          }
        }
      });

    const branches: string[] = [];
    allBranches.forEach((e) => {
      if (!checkoutBranches.has(e)) {
        branches.push(e);
      }
    });

    return branches;
  } catch (error) {
    return [];
  }
}

/**
 * "Depth First Search" to all repos that have changed
 *  It ignores the worktrees that have not changed
 */
export function searchRepoChanges(
  cwdPath: string,
  repoInfo: { [k: string]: IRepo }
) {
  const files = readdirSync(cwdPath);
  files.forEach((file) => {
    const _path = normalizePath(path.resolve(cwdPath, file));

    // ignore files
    if (checkIsDir(_path)) {
      if (checkIsWorktree(_path)) {
        const gitDirPath = normalizePath(getGitDir(_path));
        const idx = gitDirPath.lastIndexOf(
          `${path.sep}.git${path.sep}worktrees`
        );

        // main worktree path
        const repoPath = path.resolve(gitDirPath.replace(/\.git.*/, ""));

        if (idx !== -1) {
          // If in sub worktrees
          const branch = getCurrentBranch(_path);

          // FIXME: a better way to check if current path has been changed or nots
          if (_path.endsWith(path.normalize(branch))) {
            // to ignore unchanged
            return;
          }

          if (repoInfo.hasOwnProperty(repoPath)) {
            repoInfo[repoPath].worktrees!.push([_path, "", branch]);
          } else {
            const gitConfiguration = getGitConfig(repoPath);
            repoInfo[repoPath] = {
              name: gitConfiguration.reponame || "",
              path: normalizePath(repoPath),
              worktrees: [
                [_path, "", branch],
                [repoPath, "", getCurrentBranch(repoPath)],
              ],
            };
          }
        } else if (!repoInfo.hasOwnProperty(repoPath)) {
          // If in main worktrees

          const gitConfiguration = getGitConfig(repoPath);
          repoInfo[repoPath] = {
            name: gitConfiguration.reponame || "",
            path: normalizePath(repoPath),
            worktrees: [[_path, "", getCurrentBranch(repoPath)]],
          };
        }
      } else if (existsSync(path.resolve(_path, ".git"))) {
        /*
         * If current directory has a file called ".git", it means it's a worktree.
         * Due to the value "gitdir" in "".git" is not matched to the main worktree path,
         * we cannot ensure which repo it belongs to. Therefore, mark it as unknown temporarily.
         */

        if (repoInfo.unknown) {
          repoInfo.unknown.worktrees?.push([_path]);
        } else {
          repoInfo.unknown = {
            name: UNKNOWN_REPO,
            path: undefined,

            // worktree: [path, commit-hash, branch-name]
            worktrees: [[_path, "", ""]],
          };
        }
      } else {
        /**
         * Continue to search its descendants
         */
        searchRepoChanges(_path, repoInfo);
      }
    }
  });
}
