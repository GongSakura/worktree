/**
 * Handle all git commands
 */

import { execSync } from "node:child_process";
import * as path from "node:path";
import { WorktreeConfig } from "../types";
import { cwd } from "node:process";

function initRepository(context: any, next: CallableFunction) {
  const repoPath = context.cwd;
  if (getGitDir(repoPath)) {
    console.log("cannot initialize in a git directory");
    return;
  }

  if (checkIsWorktree(repoPath)) {
    context.isMainWorktree = checkIsMainWorktree(repoPath);
  } else {
    context.isMainWorktree = true;
  }

  const command =
    "git init " +
    (context?.commendOptions?.branch
      ? `-b ${context.commendOptions.branch} `
      : " ") +
    repoPath;

  try {
    execSync(command, { stdio: "pipe" });
    enableWorktreeConfig(repoPath);
    context.worktrees = getWorktrees(repoPath).reverse();
    context.gitDir = getGitDir(path.resolve(repoPath, "./.git"));
    next();
  } catch (error) {
    console.info(`initRepository error:`, error);
  }
}

function repairWorktree(context: any, next: CallableFunction) {
  const worktrees = [...context.worktrees];
  const mainWorktreePath = worktrees.pop()[0];
  const linkedWorktreePaths = worktrees.reduce((prev, cur) => {
    return `${prev} ${cur[0]}`;
  }, "");
  try {
    execSync("git worktree repair " + linkedWorktreePaths, {
      cwd: mainWorktreePath,
      stdio: "ignore",
    });
    next();
  } catch (error) {
    console.info(`RepairWorktree error:`, error);
  }
}
function configWorktree(context: any, next: CallableFunction) {
  const worktrees = context.worktrees;
  const configPath = context.config.path;
  const mainWorktreePath = context.worktrees[context.worktrees.length - 1][0];

  worktrees.forEach((worktree) => {
    try {
      execSync("git config --worktree wt.config.path " + configPath, {
        cwd: worktree[0],
        stdio: "pipe",
      });
      execSync("git config --worktree wt.config.key " + mainWorktreePath, {
        stdio: "pipe",
        cwd: worktree[0],
      });
    } catch (error) {
      console.info(`configWorktree error:`, error);
    }
  });
  next();
}
function addWorktree(context: any, next: CallableFunction) {
  const config = getWorktreeConfiguration(context.cwd);
  context.config = config;
  if (!config.path || !config.key) {
    throw new Error("Current working directory has not been initialized");
  }

  try {
    const branchName = context.command.arguments.branchName;
    const commitHash = context.command.options?.base || "";
    const newWorktreePath = path.resolve(path.dirname(config.path), branchName);
    const gitBranches = new Set(getBranches(context.cwd));

    const command =
      "git worktree add " +
      (gitBranches.has(branchName)
        ? commitHash
          ? `${newWorktreePath} ${commitHash}`
          : `${newWorktreePath} ${branchName}`
        : `-b ${branchName} ${newWorktreePath} ${commitHash}`);

    execSync(command, {
      stdio: "pipe",
    });
    context.worktrees = getWorktrees(context.cwd);
    console.info(`context.worktrees:`,context.worktrees)
    next();
  } catch (error) {
    console.info(`addWorktree error:`, error?.stderr?.toString());
  }
}

export function getWorktrees(cwdPath: string): [string, string, string][] {
  try {
    const stdout = execSync("git worktree list", {
      cwd: cwdPath,
      stdio: "pipe",
    }).toString();

    const worktrees = stdout.trim().split("\n");
    return worktrees.map((e) => {
      const [, worktreePath, commitHash, branch] = e.match(
        /^(\S+)\s+(\w+)\s+(\[[^\]]+\])$/
      );
      return [worktreePath, commitHash, branch.replace(/\[(.*?)\]/g, "$1")];
    });
  } catch (error) {
    throw error;
  }
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
    const stdout = execSync("git rev-parse --absolute-git-dir", {
      cwd: cwdPath,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return !stdout.includes(".git/worktree");
  } catch (error) {
    return false;
  }
}
export function enableWorktreeConfig(cwdPath: string): boolean {
  try {
    execSync("git config extensions.worktreeConfig true", {
      stdio: "pipe",
      cwd: cwdPath,
    });
    return true;
  } catch (error) {
    return false;
  }
}
export function getWorktreeConfiguration(cwdPath: string): WorktreeConfig {
  const config: WorktreeConfig = {};
  try {
    const stdout = execSync("git config --worktree --list", {
      cwd: cwdPath,
      stdio: ["ignore", "pipe", "pipe"],
    });

    stdout
      .toString()
      .trim()
      .split("\n")
      .forEach((e) => {
        const [k, v] = e.split("=");
        config[k.split(".").pop()] = v;
      });
  } catch (error) {
    console.log("getWorktreeConfiguration", error.stderr.toString());
  }
  return config;
}

export function getGitDir(repoPath: string): string {
  try {
    const output = execSync("git rev-parse --resolve-git-dir " + repoPath, {
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
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output.toString() ? true : false;
  } catch (error) {
    return false;
  }
}

export function getBranches(cwdPath: string): string[] {
  try {
    const stdout = execSync("git branch -a", {
      cwd: cwdPath,
      stdio: "pipe",
    })
      .toString()
      .trim();
    return stdout.split("\n");
  } catch (error) {
    console.info(`getBranches error:`, error);
    return [];
  }
}
export default {
  initRepository,
  repairWorktree,
  configWorktree,
  addWorktree,
};
