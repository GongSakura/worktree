import { execSync } from "child_process";
import * as path from "path";
import {
  getBranches,
  getGitDir,
  getWorktrees,
  initBranch,
} from "../../utils/git";
import { IWorkspace } from "../../utils/types";

function cloneRepository(context: any, next: CallableFunction) {
  const repoURL = context.command.arguments.repoURL;
  const repoPath = context.command.arguments.directory;
  const command = `git clone ${repoURL} ${repoPath}`;
  execSync(command, {
    stdio: "inherit",
  });
  context.worktrees = getWorktrees(repoPath).reverse();
  context.gitDir = getGitDir(repoPath);
  next();
}

function initRepository(context: any, next: CallableFunction) {
  const repoPath = context.cwd;
  const repoName = context.cwd.split("/").pop();
  const command =
    "git init " +
    (context.command?.options?.branch
      ? `-b ${context.command?.options?.branch} `
      : " ") +
    repoPath;

  execSync(command, { stdio: "pipe" });

  const worktrees = getWorktrees(repoPath);
  const branches = getBranches(worktrees[0][0]);
  if (!branches.length) {
    initBranch(worktrees[0][0]);
    branches.push(worktrees[0][2]);
  }
  context.branches = branches;
  context.repoName = repoName;
  context.worktrees = worktrees.reverse();
  context.gitDir = getGitDir(repoPath);
  next();
}

function configWorktree(context: any, next: CallableFunction) {
  if (context.worktrees.length) {
    const configPath = context.config.projectConfigPath;
    const mainWorktree = context.worktrees.slice(-1)[0];
    try {
      execSync("git config --local wt.config.path " + configPath, {
        cwd: mainWorktree[0],
        stdio: "pipe",
      });
    } catch (error) {
      throw error;
    }
  }

  next();
}
function addWorktree(context: any, next: CallableFunction) {
  const branchName = context.command.arguments.branchName;
  const commitHash = context.command.options?.base || "";
  const newWorktreePath = path.resolve(context.config.projectPath, branchName);
  const allBranches = new Set(getBranches(context.config.worktreePath));

  const command =
    "git worktree add " +
    (allBranches.has(branchName)
      ? commitHash
        ? `${newWorktreePath} ${commitHash}`
        : `${newWorktreePath} ${branchName}`
      : `-b ${branchName} ${newWorktreePath} ${commitHash}`);

  execSync(command, {
    cwd: context.config.worktreePath,
    stdio: "pipe",
  });

  context.worktrees = getWorktrees(context.config.worktreePath).reverse();

  next();
}
function removeWorktree(context: any, next: CallableFunction) {
  const branchName = context.command.arguments.branchName;

  const deleteWorktree = context.codeWorkspace.folders.find(
    (e: IWorkspace) => e?.name == branchName
  );

  if (deleteWorktree?.path) {
    execSync("git worktree remove -f " + deleteWorktree.path, {
      cwd: context.config.worktreePath,
      stdio: "pipe",
    });

    const isDeleteBranch = context.command.options?.force;
    if (isDeleteBranch) {
      execSync("git branch -D " + branchName, {
        cwd: context.config.worktreePath,
        stdio: "pipe",
      });
    }
  }

  context.worktrees = getWorktrees(context.config.worktreePath).reverse();
  next();
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
      stdio: "pipe",
    });
    context.worktrees = getWorktrees(mainWorktreePath).reverse();
    next();
  } catch (error) {
    throw error;
  }
}

export default {
  cloneRepository,
  initRepository,
  repairWorktree,
  configWorktree,
  addWorktree,
  removeWorktree,
};
