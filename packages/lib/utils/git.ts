import { execSync } from "child_process";
import * as path from "path";
import { IWorktreeConfig } from "./types";

export function getWorktrees(cwdPath: string): [string, string, string][] {
  const worktrees: [string, string, string][] = [];
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
  } catch (error) {
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
// export function enableWorktreeConfig(cwdPath: string) {
//   execSync("git config extensions.worktreeConfig true", {
//     stdio: "pipe",
//     cwd: cwdPath,
//   });
// }

export function getWorktreeConfiguration(cwdPath: string): IWorktreeConfig {
  const config: IWorktreeConfig = {};
  try {
    const stdout = execSync("git config --list", {
      cwd: cwdPath,
      stdio: "pipe",
    });

    stdout
      .toString()
      .trim()
      .split("\n")
      .forEach((e) => {
        const [k, v] = e.split("=");
        if (k === "wt.config.path") {
          config.path = v;
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
export function getBranches(cwdPath: string): string[] {
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
        if (e) {
          const v = e.split(" ").pop();
          if (v) {
            branches.push(v);
          }
        }
      });
    return branches;
  } catch (error) {
    console.info(`getBranches error:`, error);
    return [];
  }
}

export function getGitRepoName(cwdPath: string) {
  try {
    return path
      .normalize(
        execSync("git remote show origin", {
          cwd: cwdPath,
          stdio: "pipe",
        })
          .toString()
          .trim()
      )
      .split("/")
      .pop();
  } catch {
    return cwdPath.trim().split("/").pop();
  }
}
