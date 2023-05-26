/**
 * Handle all git commands
 */

import { execSync } from "node:child_process";
import * as path from "node:path";
import {
  enableWorktreeConfig,
  getBranches,
  getGitDir,
  getWorktrees,
} from "../../utils/git";
import { Workspace } from "../../utils/types";

function initRepository(context: any, next: CallableFunction) {
  const repoPath = context.cwd;
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
    throw error;
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
    throw error;
  }
}
function configWorktree(context: any, next: CallableFunction) {
  const configPath = context.config.projectConfigPath;

  context.worktrees.forEach((worktree: string[]) => {
    try {
      execSync("git config --worktree wt.config.path " + configPath, {
        cwd: worktree[0],
        stdio: "pipe",
      });
    } catch (error) {
      throw error;
    }
  });
  next();
}
function addWorktree(context: any, next: CallableFunction) {
  const branchName = context.command.arguments.branchName;
  const commitHash = context.command.options?.base || "";
  const newWorktreePath = path.resolve(context.config.projectPath, branchName);
  const allBranches = new Set(getBranches(context.config.mainWorktreePath));

  const command =
    "git worktree add " +
    (allBranches.has(branchName)
      ? commitHash
        ? `${newWorktreePath} ${commitHash}`
        : `${newWorktreePath} ${branchName}`
      : `-b ${branchName} ${newWorktreePath} ${commitHash}`);

  execSync(command, {
    cwd: context.config.mainWorktreePath,
    stdio: "pipe",
  });
  context.worktrees = getWorktrees(context.config.mainWorktreePath);

  next();
}
function removeWorktree(context: any, next: CallableFunction) {
  const branchName = context.command.arguments.branchName;

  const deleteWorktree = context.codeWorkspace.folders.find(
    (e: Workspace) => e?.name == branchName
  );

  if (deleteWorktree?.path) {
    execSync("git worktree remove -f " + deleteWorktree.path, {
      cwd: context.config.mainWorktreePath,
      stdio: "pipe",
    });
  }

  const isDeleteBranch = context.command.options?.force;
  if (isDeleteBranch) {
    execSync("git branch -D " + branchName, {
      cwd: context.config.mainWorktreePath,
      stdio: "pipe",
    });
  }

  context.worktrees = getWorktrees(context.config.mainWorktreePath);
  next();
}

export default {
  initRepository,
  repairWorktree,
  configWorktree,
  addWorktree,
  removeWorktree,
};
