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
import { mkdirSync, readdirSync, statSync } from "fs";
import inquirer from "inquirer";
import {
  selectBranchQuestion,
  selectRepoQuestion,
  selectWorktreeQuestion,
} from "../../utils/prompts";
import { ErrorProcessor } from "../index";

function checkInitPrerequisite(context: IContext, next: CallableFunction) {
  const repoPath = context.cwd;
  if (checkIsGitDir(repoPath)) {
    throw new Error(`Cannot execute commands inside a ".git" folder`);
  }

  const [projectConfig, worktreeConfig] = getConfigs(repoPath);

  if (Object.keys(worktreeConfig).length || Object.keys(projectConfig).length) {
    throw new Error(
      `The directory: "${repoPath}" has already been initialized`
    );
  }

  context.projectPath = repoPath;
  context.projectType = EPROJECT_TYPE.SINGLE;
  next();
}

function checkClonePrerequisite(context: IContext, next: CallableFunction) {
  checkInitPrerequisite(context, next);
}

function checkAddPrerequisite(context: IContext, next: CallableFunction) {
  const [projectConfig, gitConfig] = getConfigs(context.cwd);

  checkIsInsideProject([projectConfig, gitConfig]);
  if (!projectConfig.repos?.length) {
    throw new Error("The project hasn't linked to any repository.");
  }
  context.projectConfig = projectConfig;
  context.projectConfigPath = gitConfig?.path
    ? gitConfig.path
    : path.resolve(context.cwd, EPROJECT_FILES.CONFIGURATION);
  context.projectPath = gitConfig?.path
    ? path.dirname(gitConfig.path)
    : context.cwd;
  context.repos = projectConfig.repos;
  context.projectType = projectConfig.type;

  if (context.projectType === EPROJECT_TYPE.MULTIPLE) {
    if (!context.repos.length) {
      throw new Error("No linked repository");
    }
    if (!context.command.options.repo && context.command.arguments.branchName) {
      throw new Error(`The option "--repo" is missing.`);
    }
    if (context.command.options.repo && !context.command.arguments.branchName) {
      throw new Error(`The argument "branch-name" is missing.`);
    }
    if (
      !context.command.options.repo &&
      !context.command.arguments.branchName
    ) {
      inquirer
        .prompt(selectRepoQuestion(context.repos.map((repo) => repo.name)))
        .then((answer) => {
          const repo = context.repos?.find(
            (repo) => repo.name === answer.repoName
          );

          if (!repo || !repo.path) {
            throw new Error(
              `Cannot find the repository "${answer.repoName}" in the project`
            );
          }

          context.selectedRepo = repo;
          const uncheckoutBranches = getUncheckoutBranches(
            context.selectedRepo.path!
          );
          if (!uncheckoutBranches.length) {
            throw new Error(
              `No available branches can be checkout.\n       You should use "wt add --repo [repo-name] [branch-name]" to add a linked worktree. `
            );
          }
          return inquirer.prompt(selectBranchQuestion(uncheckoutBranches));
        })
        .then((answer) => {
          context.command.arguments.branchName = answer.branchName;
          next();
        })
        .catch((error) => {
          ErrorProcessor.captureError(context, () => {
            throw error;
          });
        });
    } else {
      const repo = context.repos?.find(
        (repo) => repo.name === context.command.options.repo
      );

      if (!repo || !repo.path) {
        throw new Error(
          `Cannot find the "${context.command.options.repo}" repository in the project`
        );
      }

      context.selectedRepo = repo;
      next();
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
  const [projectConfig, gitConfig] = getConfigs(context.cwd);
  checkIsInsideProject([projectConfig, gitConfig]);
  if (!projectConfig.repos?.length) {
    throw new Error("The project hasn't linked to any repository.");
  }

  context.projectConfig = projectConfig;
  context.projectConfigPath = gitConfig?.path
    ? gitConfig.path
    : path.resolve(context.cwd, EPROJECT_FILES.CONFIGURATION);

  context.projectPath = gitConfig?.path
    ? path.dirname(gitConfig!.path)
    : context.cwd;
  context.repos = projectConfig.repos;
  context.projectType = projectConfig.type;

  if (context.projectType === EPROJECT_TYPE.MULTIPLE) {
    if (!context.repos.length) {
      throw new Error("No linked repository");
    }
    if (!context.command.options.repo && context.command.arguments.branchName) {
      throw new Error(`The option "--repo" is missing.`);
    }
    if (context.command.options.repo && !context.command.arguments.branchName) {
      throw new Error(`The argument "branch-name" is missing.`);
    }
    if (
      !context.command.options.repo &&
      !context.command.arguments.branchName
    ) {
      inquirer
        .prompt(selectRepoQuestion(context.repos.map((repo) => repo.name)))
        .then((answer) => {
          const repo = context.repos?.find(
            (repo) => repo.name === answer.repoName
          );

          if (!repo || !repo.path) {
            throw new Error(
              `Cannot find the repository: "${answer.repoName}" in the project`
            );
          }

          context.selectedRepo = repo;
          const worktrees: string[][] = getWorktrees(
            context.selectedRepo.path!
          ).reverse();

          // skip the main worktree
          worktrees.pop();
          if (!worktrees.length) {
            throw new Error("No available worktrees can be removed");
          }

          return inquirer.prompt(
            selectWorktreeQuestion(worktrees.map((e) => `${e[0]} [${e[2]}]`))
          );
        })
        .then((answer) => {
          const [removeWorktreePath, branchName] = answer.worktree.split(" ");
          context.removeWorktrees = [
            [removeWorktreePath, "", branchName.replace(/\[(.*?)\]/g, "$1")],
          ];
          next();
        })
        .catch((error) => {
          ErrorProcessor.captureError(context, () => {
            throw error;
          });
        });
    } else {
      const repo = context.repos?.find(
        (repo) => repo.name === context.command.options.repo
      );

      if (!repo || !repo.path) {
        throw new Error(
          `Cannot find the repository: "${context.command.options.repo}" in the project`
        );
      }

      context.removeWorktrees = [
        [
          path.resolve(
            context.projectPath,
            `${context.command.options.repo}#${context.command.arguments.branchName}`
          ),
          ,
          context.command.arguments.branchName,
        ],
      ];
      next();
    }
  } else {
    context.selectedRepo = context.repos[0];

    if (!context.command.arguments.branchName) {
      const worktrees: string[][] = getWorktrees(
        context.selectedRepo.path!
      ).reverse();

      // skip the main worktree
      worktrees.pop();
      if (!worktrees.length) {
        throw new Error("No available worktrees can be removed");
      }

      inquirer
        .prompt(
          selectWorktreeQuestion(worktrees.map((e) => `${e[0]} [${e[2]}]`))
        )
        .then((answer) => {
          const [removeWorktreePath, branchName] = answer.worktree.split(" ");
          context.removeWorktrees = [
            [removeWorktreePath, "", branchName.replace(/\[(.*?)\]/g, "$1")],
          ];
          next();
        })
        .catch((err) => {
          ErrorProcessor.captureError(context, () => {
            throw err;
          });
        });
    } else {
      context.removeWorktrees = [
        [
          path.resolve(
            context.projectPath,
            context.command.arguments.branchName
          ),
          ,
          context.command.arguments.branchName,
        ],
      ];
      next();
    }
  }
}

function checkUpdatePrerequisite(context: IContext, next: CallableFunction) {
  const [projectConfig, gitConfig] = getConfigs(context.cwd);

  checkIsInsideProject([projectConfig, gitConfig]);
  if (!projectConfig.repos?.length) {
    throw new Error("The project hasn't linked to any repository.");
  }

  context.projectConfigPath = gitConfig?.path
    ? gitConfig.path
    : path.resolve(context.cwd, EPROJECT_FILES.CONFIGURATION);
  context.projectPath = gitConfig?.path
    ? path.dirname(gitConfig.path)
    : context.cwd;

  context.projectType = projectConfig.type;

  next();
}

function checkCreatePrerequisite(context: IContext, next: CallableFunction) {
  const repoPath = context.cwd;
  if (checkIsGitDir(repoPath)) {
    throw new Error(`Cannot create inside the ".git" folder`);
  }

  const [projectConfig, gitConfig] = getConfigs(repoPath);
  if (Object.keys(gitConfig).length || Object.keys(projectConfig).length) {
    throw new Error(
      `The directory: "${repoPath}" has already been initialized`
    );
  }
  try {
    const stat = statSync(repoPath);
    if (stat.isFile()) {
      throw new Error(
        `Cannot create the project inside a file path: ${repoPath}`
      );
    }
  } catch {
    mkdirSync(repoPath);
  }
  context.projectPath = repoPath;
  context.projectType = EPROJECT_TYPE.MULTIPLE;
  context.repos = [];
  next();
}

function checkLinkPrerequisite(context: IContext, next: CallableFunction) {
  const [projectConfig, gitConfig] = getConfigs(context.cwd);
  checkIsInsideProject([projectConfig, gitConfig]);
  if (projectConfig?.type !== EPROJECT_TYPE.MULTIPLE) {
    throw new Error('Cannot use "wt link" inside a "single-repo" project.');
  }

  context.projectConfigPath = gitConfig?.path
    ? gitConfig.path
    : path.resolve(context.cwd, EPROJECT_FILES.CONFIGURATION);
  context.projectPath = gitConfig?.path
    ? path.dirname(gitConfig.path)
    : context.cwd;

  context.projectType = projectConfig.type;
  context.repos = projectConfig.repos;
  context.repos.forEach((repo: IRepo) => {
    if (repo.name === context.command.arguments.repoName) {
      throw new Error(`The repo name: ${repo.name} is exited`);
    }
    if (repo.path) {
      repo.worktrees = getWorktrees(repo.path).reverse();
    }
  });
  next();
}
function checkUnlinkPrerequisite(context: IContext, next: CallableFunction) {
  const [projectConfig, gitConfig] = getConfigs(context.cwd);
  checkIsInsideProject([projectConfig, gitConfig]);
  if (projectConfig?.type !== EPROJECT_TYPE.MULTIPLE) {
    throw new Error('Cannot use "wt unlink" inside a "single-repo" project.');
  }
  context.projectConfigPath = gitConfig?.path
    ? gitConfig.path
    : path.resolve(context.cwd, EPROJECT_FILES.CONFIGURATION);
  context.projectPath = gitConfig?.path
    ? path.dirname(gitConfig.path)
    : context.cwd;
  context.projectType = projectConfig.type;
  context.repos = projectConfig.repos;
  if (!context.repos.length) {
    throw new Error("No linked repository");
  }
  if (context.command.arguments.repoName) {
    next();
  } else {
    inquirer
      .prompt(selectRepoQuestion(context.repos.map((repo) => repo.name)))
      .then((answer) => {
        context.command.arguments.repoName = answer.repoName;
        next();
      })
      .catch((error) => {
        ErrorProcessor.captureError(context, () => {
          throw error;
        });
      });
  }
}

function inspectPotentialWorktrees(context: IContext, next: CallableFunction) {
  const files = readdirSync(context.projectPath!);

  // TODO: feature suppport multi-repo
  const multiRepoWorktrees: IMultiRepoWorktreePaths = {};

  files.forEach((file) => {
    const _path = path.resolve(context.projectPath!, file);

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
      worktrees: [...value, [key, "", getCurrentBranch(key)]],
    });
  }

  context.repos = repos;
  next();
}

function checkIsInsideProject(configs: [IProjectConfig, IGitConfig]): void {
  let [projectConfig, gitConfig] = configs;

  if (!Object.keys(projectConfig).length && !gitConfig.path) {
    throw new Error("Cannot execute commands outside a worktree project.");
  }

  if (gitConfig.path) {
    const tempProjectConfig = getProjectFile(
      path.dirname(gitConfig.path),
      EPROJECT_FILES.CONFIGURATION
    );

    if (!Object.keys(tempProjectConfig).length) {
      throw new Error(`"wt.config.json" is missing.`);
    }

    projectConfig.repos = tempProjectConfig.repos;
    projectConfig.type = tempProjectConfig.type;
  }

  if (projectConfig.type === undefined) {
    throw new Error(`The property "type" in "wt.config.json" is missing.`);
  }
}

export default {
  checkCreatePrerequisite,
  checkLinkPrerequisite,
  checkUnlinkPrerequisite,
  checkInitPrerequisite,
  checkClonePrerequisite,
  checkAddPrerequisite,
  checkRemovePrerequisite,
  checkUpdatePrerequisite,
  inspectPotentialWorktrees,
};
