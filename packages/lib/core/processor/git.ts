/**
 *
 * By default, the last element of the worktree list is the main worktree
 *
 */
import { execSync } from "child_process";
import * as path from "path";
import {
  getAllBranches,
  getGitDir,
  getWorktrees,
  initBranch,
} from "../../utils/git";
import { IContext, IRepo } from "../../utils/types";

function cloneRepository(context: IContext, next: CallableFunction) {
  const repoURL = context.command.arguments.repoURL;
  const repoPath = context.command.arguments.directory;
  const repoName = repoURL
    .split("/")
    .pop()
    .replace(/\.git$/, "");
  const command = `git clone ${repoURL} ${repoPath}`;
  execSync(command, {
    stdio: "inherit",
  });
  context.repos = [
    {
      name: repoName,
      path: repoPath,
      worktrees: getWorktrees(repoPath).reverse(),
      gitDir: getGitDir(repoPath),
    },
  ];
  next();
}

function initRepository(context: IContext, next: CallableFunction) {
  const repoPath = context.cwd;
  const repoName = context.cwd.split("/").pop();

  execSync(
    "git init " +
      (context.command?.options?.branch
        ? `-b ${context.command?.options?.branch} `
        : " ") +
      repoPath,
    { stdio: "pipe" }
  );

  const worktrees = getWorktrees(repoPath);
  const branches = getAllBranches(worktrees[0][0]);
  if (!branches.length) {
    initBranch(worktrees[0][0]);
    branches.push(worktrees[0][2]);
  }
  context.repos = [
    {
      name: repoName,
      worktrees: worktrees.reverse(),
      branches,
      gitDir: getGitDir(repoPath),
    } as IRepo,
  ];

  next();
}

function configWorktree(context: any, next: CallableFunction) {
  if (context.repos.length) {
    const configPath = context.config.projectConfigPath;
    context.repos.forEach((repo: IRepo) => {
      execSync("git config --local wt.config.path " + configPath, {
        cwd: repo.path,
        stdio: "pipe",
      });
      execSync("git config --local wt.config.repoName " + repo.name, {
        cwd: repo.path,
        stdio: "pipe",
      });
    });
    next();
  } else {
    throw new Error("Empty worktree list");
  }
}

function addWorktree(context: IContext, next: CallableFunction) {
  const branchName = context.command.arguments.branchName;
  const commitHash = context.command.options?.base || "";
  const newWorktreePath = path.resolve(context.projectPath!, branchName);
  const mainWorktreePath = context.selectedRepo!.path!;
  const allBranches = new Set(getAllBranches(mainWorktreePath));

  const command =
    "git worktree add " +
    (allBranches.has(branchName)
      ? commitHash
        ? `${newWorktreePath} ${commitHash}`
        : `${newWorktreePath} ${branchName}`
      : `-b ${branchName} ${newWorktreePath} ${commitHash}`);

  execSync(command, {
    cwd: mainWorktreePath,
    stdio: "pipe",
  });

  context.selectedRepo!.worktrees = getWorktrees(mainWorktreePath).reverse();

  next();
}

function removeWorktree(context: IContext, next: CallableFunction) {
  const [deleteWorktreePath, , branchName] = context.deleteWorktree!;
  const mainWorktreePath = context.selectedRepo!.path!;
  if (deleteWorktreePath) {
    execSync("git worktree remove -f " + deleteWorktreePath, {
      cwd: context.selectedRepo!.path!,
      stdio: "pipe",
    });

    const isDeleteBranch = context.command.options?.force;
    if (isDeleteBranch) {
      execSync("git branch -D " + branchName, {
        cwd: mainWorktreePath,
        stdio: "pipe",
      });
    }
  }

  context.selectedRepo!.worktrees = getWorktrees(mainWorktreePath).reverse();
  next();
}
function repairWorktree(context: IContext, next: CallableFunction) {
  context.repos?.forEach((repo: IRepo) => {
    const worktrees = [...repo.worktrees!];
    const mainWorktreePath = worktrees.pop()![0];
    const linkedWorktreePaths = worktrees.reduce((prev, cur) => {
      return `${prev} ${cur[0]}`;
    }, "");

    execSync("git worktree repair " + linkedWorktreePaths, {
      cwd: mainWorktreePath,
      stdio: "pipe",
    });
    repo.worktrees = getWorktrees(mainWorktreePath).reverse();
    repo.path = mainWorktreePath;
  });
  next();
}

export default {
  cloneRepository,
  initRepository,
  repairWorktree,
  configWorktree,
  addWorktree,
  removeWorktree,
};
