/**
 *
 * By default, the last element of the worktree list is the main worktree
 *
 */
import { execSync } from "node:child_process";
import * as path from "node:path";
import {
  getAllBranches,
  getCurrentBranch,
  getGitDir,
  getLocalBranches,
  getWorktrees,
  initBranch,
  searchRepos,
} from "../../utils/git";
import { EPROJECT_TYPE, IContext, IRepo } from "../../utils/types";
import { DEFAULT_BRANCH } from "../../utils/constants";
import { moveSync } from "fs-extra";

function cloneRepository(context: IContext, next: CallableFunction) {
  const repoURL = context.command.arguments.repoURL;
  const repoPath = context.command.arguments.directory;
  const repoName = repoURL
    .split(path.sep)
    .pop()
    .replace(/\.git$/, "");

  execSync(`git clone ${repoURL} ${repoPath}`, {
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
  const repoPath = context.command.arguments.directory;
  const repoName = repoPath.split(path.sep).pop();

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
function linkRepository(context: IContext, next: CallableFunction) {
  if (
    path.isAbsolute(context.command.arguments.repoURL) ||
    context.command.arguments.repoURL[0] === "."
  ) {
    next();
  } else {
    const repoURL = context.command.arguments.repoURL;
    const repoName = context.command.arguments.repoName;

    let repoPath = path.resolve(
      context.projectPath!,
      context.projectType === EPROJECT_TYPE.MULTIPLE
        ? `${repoName}${path.sep}${DEFAULT_BRANCH}`
        : DEFAULT_BRANCH
    );

    execSync(`git clone ${repoURL} ${repoPath}`, {
      stdio: "inherit",
    });
    const currentBranch = getCurrentBranch(repoPath);
    if (currentBranch !== DEFAULT_BRANCH) {
      const realRepoPath = path.resolve(
        context.projectPath!,
        context.projectType === EPROJECT_TYPE.MULTIPLE
          ? `${repoName}${path.sep}${currentBranch}`
          : currentBranch
      );
      moveSync(repoPath, realRepoPath);
      repoPath = realRepoPath;
    }

    const repo: IRepo = {
      name: repoName,
      path: repoPath,
      worktrees: getWorktrees(repoPath).reverse(),
    };
    if (Array.isArray(context.repos)) {
      context.repos.push(repo);
    } else {
      context.repos = [repo];
    }
    next();
  }
}

function inspectRepository(context: IContext, next: CallableFunction) {
  const repos: any = {};
  searchRepos(context.projectPath!, repos);
  context.reposMap = repos;
  next();
}

function configWorktree(context: IContext, next: CallableFunction) {
  context.repos?.forEach((repo: IRepo) => {
    const configPath = context.projectConfigPath;

    execSync("git config --local wt.config.path " + configPath, {
      cwd: repo.path,
      stdio: "pipe",
    });
    execSync("git config --local wt.config.reponame " + repo.name, {
      cwd: repo.path,
      stdio: "pipe",
    });
  });
  next();
}

function addWorktree(context: IContext, next: CallableFunction) {
  const branchName = context.command.arguments.branchName;
  const commitHash = context.command.options?.base || "";
  const repo = context.selectedRepo;
  const mainWorktreePath = repo?.path!;
  const newWorktreePath = path.resolve(
    context.projectPath!,
    context.projectType === EPROJECT_TYPE.MULTIPLE
      ? `${repo?.name}${path.sep}${branchName}`
      : branchName
  );
  const allBranches = new Set(getLocalBranches(mainWorktreePath));
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
  const [removeWorktreePath, , branchName] = context.removeWorktrees![0];
  const mainWorktreePath = context.selectedRepo!.path!;
  if (removeWorktreePath) {
    execSync("git worktree remove -f " + removeWorktreePath, {
      cwd: context.selectedRepo!.path!,
      stdio: "pipe",
    });
    execSync("git worktree prune ", {
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
    const linkedWorktreePaths = worktrees.reduce((prev, cur) => {
      return `${prev} ${cur[0]}`;
    }, "");

    execSync("git worktree repair " + linkedWorktreePaths, {
      cwd: repo.path,
      stdio: "pipe",
    });
    execSync("git worktree prune ", {
      cwd: repo.path,
      stdio: "pipe",
    });
    repo.worktrees = getWorktrees(repo.path!).reverse();
  });
  next();
}
export default {
  cloneRepository,
  initRepository,
  linkRepository,
  repairWorktree,
  configWorktree,
  addWorktree,
  removeWorktree,
  inspectRepository,
};
