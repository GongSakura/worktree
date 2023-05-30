import * as path from "path";
import {
  checkIsGitDir,
  checkIsWorktree,
 
  getCurrentBranch,
  getGitConfiguration,
  getGitDir,
  getUncheckoutBranches,
  getWorktrees,
} from "../../utils/git";
import { getConfigs, getProjectFile } from "../../utils/file";
import {
  IMultiRepoWorktreePaths,
  EPROJECT_FILES,
  EPROJECT_TYPE,
  IProjectConfig,
  IGitConfig,
  IContext,
  IRepo,
} from "../../utils/types";
import { readdirSync } from "fs";
import inquirer from "inquirer";
import {
  selectBranchQuestion,
  selectWorktreeQuestion,
} from "../../utils/prompts";
import { ErrorProcessor } from "..";

function checkInitPrerequisite(context: any, next: CallableFunction) {
  const repoPath = context.cwd;
  if (checkIsGitDir(repoPath)) {
    throw new Error(`Cannot create inside the ".Git" folder`);
  }

  const [projectConfig, worktreeConfig] = getConfigs(repoPath);
  if (projectConfig?.type === EPROJECT_TYPE.MULTIPLE) {
    throw new Error(
      'Cannot initialize inside a "multiple-repositories" worktree project. If you want to init a git repo, use "wt link"'
    );
  }

  if (worktreeConfig.path || projectConfig?.repos?.length) {
    throw new Error(`The directory: "${repoPath}" has already initialized`);
  }

  context.projectPath = repoPath;
  context.projectType = EPROJECT_TYPE.SINGLE;
  next();
}

function checkClonePrerequisite(context: any, next: CallableFunction) {
  checkInitPrerequisite(context, next);
}

function checkAddPrerequisite(context: IContext, next: CallableFunction) {
  const [projectConfig, worktreeConfig] = getConfigs(context.cwd);

  if (!checkIsInsideProject([projectConfig, worktreeConfig])) {
    if (!projectConfig.type && !projectConfig.repos?.length) {
      throw new Error("Cannot add a worktree outside the worktree project.");
    } else if (!projectConfig.repos?.length) {
      throw new Error(
        "The worktree project has not linked to any Git repository."
      );
    } else {
      throw new Error("The type of the worktree project isn't specified.");
    }
  }

  context.projectConfig = projectConfig;
  context.projectConfigPath = worktreeConfig?.path
    ? worktreeConfig.path
    : path.resolve(context.cwd, EPROJECT_FILES.CONFIGURATION);

  context.projectPath = worktreeConfig?.path
    ? path.dirname(worktreeConfig.path)
    : context.cwd;

  context.repos = projectConfig.repos;
  context.projectType = projectConfig.type;

  if (context.projectType === EPROJECT_TYPE.MULTIPLE) {
    // TODO: multiple repo
    if (!context.command.options.repo) {
    }
  } else {
    context.selectedRepo = context.repos[0];
    if (!context.command.arguments.branchName) {
      const uncheckoutBranches = getUncheckoutBranches(
        context.selectedRepo.path!
      );
      if (!uncheckoutBranches.length) {
        throw new Error('The arugument "branch-name" is missing');
      }

      inquirer
        .prompt(selectBranchQuestion(uncheckoutBranches))
        .then((answer) => {
          context.command.arguments.branchName = answer.branchName;
          next();
        })
        .catch((err) => {
          ErrorProcessor.captureError(context, () => {
            throw err;
          });
        });
    } else {
      next();
    }
  }
}

function checkRemovePrerequisite(context: IContext, next: CallableFunction) {
  const [projectConfig, worktreeConfig] = getConfigs(context.cwd);

  if (!checkIsInsideProject([projectConfig, worktreeConfig])) {
    if (!projectConfig.type && !projectConfig.repos?.length) {
      throw new Error("Cannot remove a worktree outside the worktree project.");
    } else if (!projectConfig.repos?.length) {
      throw new Error(
        "The worktree project has not linked to any Git repository."
      );
    } else {
      throw new Error("The type of the worktree project isn't specified.");
    }
  }

  context.projectConfig = projectConfig;
  context.projectConfigPath = worktreeConfig?.path
    ? worktreeConfig.path
    : path.resolve(context.cwd, EPROJECT_FILES.CONFIGURATION);

  context.projectPath = worktreeConfig?.path
    ? path.dirname(worktreeConfig.path)
    : context.cwd;

  context.repos = projectConfig.repos;
  context.projectType = projectConfig.type;

  if (context.projectType === EPROJECT_TYPE.MULTIPLE) {
    // TODO: multiple repo
    if (!context.command.options.repo) {
    }
  } else {
    context.selectedRepo = context.repos[0];
    if (!context.command.arguments.branchName) {
      const worktrees: string[][] = getWorktrees(context.selectedRepo.path!).reverse();

      // skip the main worktree
      worktrees.pop();

      inquirer
        .prompt(
          selectWorktreeQuestion(worktrees.map((e) => `${e[0]} [${e[2]}]`))
        )
        .then((answer) => {
          const [deleteWorktreePath, branchName] = answer.worktree.split(" ");
          context.deleteWorktree = [
            deleteWorktreePath,
            "",
            branchName.replace(/\[(.*?)\]/g, "$1"),
          ];
          next();
        })
        .catch((err) => {
          ErrorProcessor.captureError(context, () => {
            throw err;
          });
        });
    } else {
      context.deleteWorktree = [
        path.resolve(context.projectPath, context.command.arguments.branchName),
        ,
        context.command.arguments.branchName,
      ];
      next();
    }
  }
}

function checkUpdatePrerequisite(context: any, next: CallableFunction) {
  const [projectConfig, worktreeConfig] = getConfigs(context.cwd);

  if (!checkIsInsideProject([projectConfig, worktreeConfig])) {
    if (!projectConfig.type && !projectConfig.repos?.length) {
      throw new Error("Cannot upate outside the worktree project.");
    } else if (!projectConfig.repos?.length) {
      throw new Error(
        "The worktree project has not linked to any Git repository."
      );
    } else {
      throw new Error("The type of the worktree project isn't specified.");
    }
  }

  context.projectConfigPath = worktreeConfig?.path
    ? worktreeConfig.path
    : path.resolve(context.cwd, EPROJECT_FILES.CONFIGURATION);
  context.projectPath = worktreeConfig?.path
    ? path.dirname(worktreeConfig.path)
    : context.cwd;

  context.projectType = projectConfig.type;

  next();
}
function checkCreatePrerequisite(context: any, next: CallableFunction) {}

function inspectPotentialWorktrees(context: any, next: CallableFunction) {
  const files = readdirSync(context.projectPath);

  // TODO: feature suppport multi-repo
  const multiRepoWorktrees: IMultiRepoWorktreePaths = {};

  files.forEach((file) => {
    const _path = path.resolve(context.projectPath, file);

    if (checkIsWorktree(_path)) {
      const gitDirPath = getGitDir(_path);
      const mainWorktreePath = gitDirPath.replace(/\/.git.*/, "");
      const idx = gitDirPath.lastIndexOf("/.git/worktrees");
      if (idx !== -1) {
        const branch = getCurrentBranch(_path);
        const key = gitDirPath.substring(0, idx);
        if (multiRepoWorktrees.hasOwnProperty(key)) {
          multiRepoWorktrees[key].push([_path, "", branch]);
        } else {
          multiRepoWorktrees[key] = [[_path, "", branch]];
        }
      } else if (!multiRepoWorktrees.hasOwnProperty(mainWorktreePath)) {
        multiRepoWorktrees[mainWorktreePath] = [];
      }
    }
  });

  const repos: IRepo[] = [];
  for (const [key, value] of Object.entries(multiRepoWorktrees)) {
    const gitConfiguration = getGitConfiguration(key);
    repos.push({
      name: gitConfiguration.reponame || "",
      path: key,
      alias: gitConfiguration.alias,
      worktrees: [...value, [key, "", getCurrentBranch(key)]],
    });
  }

  context.repos = repos;
  next();
}

function checkIsInsideProject(configs: [IProjectConfig, IGitConfig]): boolean {
  let [projectConfig, worktreeConfig] = configs;
  if (projectConfig?.repos?.length && projectConfig?.type) {
    return true;
  } else if (worktreeConfig.path && worktreeConfig.reponame) {
    const tempProjectConfig = getProjectFile(
      path.dirname(worktreeConfig.path),
      EPROJECT_FILES.CONFIGURATION
    );

    if (tempProjectConfig?.repos?.length && tempProjectConfig?.type) {
      projectConfig.repos = tempProjectConfig.repos;
      projectConfig.type = tempProjectConfig.type;
      return true;
    }
  }
  return false;
}

export default {
  checkInitPrerequisite,
  checkClonePrerequisite,
  checkAddPrerequisite,
  checkRemovePrerequisite,
  checkUpdatePrerequisite,
  inspectPotentialWorktrees,
};
