import { execSync } from "node:child_process";
import { WorktreeConfig } from "./types";

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
      stdio: ["ignore", "pipe", "ignore"],
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
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim()
      .includes(".git/worktree/");
  } catch (error: unknown) {
    return false;
  }
}
export function enableWorktreeConfig(cwdPath: string) {
  execSync("git config extensions.worktreeConfig true", {
    stdio: "pipe",
    cwd: cwdPath,
  });
}

export function getWorktreeConfiguration(cwdPath: string): WorktreeConfig {
  const config: WorktreeConfig = {};
  try {
    const stdout = execSync("git config --worktree --list", {
      cwd: cwdPath,
      stdio: "pipe",
    });

    stdout
      .toString()
      .trim()
      .split("\n")
      .forEach((e) => {
        const [k, v] = e.split("=");
        const idx = k.split(".").pop();
        if (idx === "path") {
          config[idx] = v;
        }
      });
  } catch (error: any) {
    console.log("getWorktreeConfiguration", error?.stderr?.toString());
  }
  return config;
}

export function getGitDir(repoPath: string): string {
  try {
    const output = execSync("git rev-parse --absolute-git-dir ", {
      cwd: repoPath,
      stdio: ["ignore", "pipe", "ignore"],
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
    }).toString();

    return output === "true";
  } catch (error) {
    return false;
  }
}

export function initBranch(repoPath: string) {
  execSync("echo > README.md", {
    cwd: repoPath,
  });
  execSync("git add README.md", {
    cwd: repoPath,
  });
  execSync('git commit -m"Initial commit"', {
    cwd: repoPath,
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
