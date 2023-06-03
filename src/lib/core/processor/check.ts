import * as path from "node:path";
import {
  checkIsGitDir,
  checkIsWorktree,
  getCurrentBranch,
  getGitConfiguration,
  getGitDir,
  getUncheckoutBranches,
  getWorktrees,
} from "../../utils/git";
import { getConfigs, getProjectFile, normalizePath } from "../../utils/file";
import {
  IMultiRepoWorktreePaths,
  EPROJECT_FILES,
  EPROJECT_TYPE,
  IProjectConfig,
  IGitConfig,
  IContext,
  IRepo,
} from "../../utils/types";
import { mkdirSync, readdirSync, statSync } from "node:fs";
import select from "@inquirer/select";
import {
  selectBranchQuestion,
  selectRepoQuestion,
  selectWorktreeQuestion,
} from "../../utils/prompts";
import { ErrorProcessor } from "../index";
import {
  ERROR_LINK_DUPLICATE,
  ERROR_LINK_TO_SINGLE,
} from "../../utils/constants";

function checkInitPrerequisite(context: IContext, next: CallableFunction) {
  const repoPath = normalizePath(context.command.arguments.directory);
  if (checkIsGitDir(repoPath)) {
    throw new Error(`Cannot execute commands inside a ".git" folder`);
  }

  const [projectConfig, worktreeConfig] = getConfigs(repoPath);

  if (Object.keys(worktreeConfig).length || Object.keys(projectConfig).length) {
    throw new Error(
      `The directory: "${repoPath}" has already been initialized`
    );
  }
  context.projectConfigPath = normalizePath(
    path.resolve(repoPath, EPROJECT_FILES.CONFIGURATION)
  );
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
  context.projectConfigPath = normalizePath(
    gitConfig?.path
      ? gitConfig.path
      : path.resolve(context.cwd, EPROJECT_FILES.CONFIGURATION)
  );
  context.projectPath = normalizePath(
    gitConfig?.path ? path.dirname(gitConfig.path) : context.cwd
  );
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
      select<string>(selectRepoQuestion(context.repos.map((repo) => repo.name)))
        .then((answer) => {
          const repo = context.repos?.find((repo) => repo.name === answer);

          if (!repo || !repo.path) {
            throw new Error(
              `Cannot find the repository "${answer}" in the project`
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
          return select<string>(selectBranchQuestion(uncheckoutBranches));
        })
        .then((answer) => {
          context.command.arguments.branchName = answer;
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

      select<string>(selectBranchQuestion(uncheckoutBranches))
        .then((answer) => {
          context.command.arguments.branchName = answer;
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
  context.projectConfigPath = normalizePath(
    gitConfig?.path
      ? gitConfig.path
      : path.resolve(context.cwd, EPROJECT_FILES.CONFIGURATION)
  );

  context.projectPath = normalizePath(
    gitConfig?.path ? path.dirname(gitConfig!.path) : context.cwd
  );
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
      select<string>(selectRepoQuestion(context.repos.map((repo) => repo.name)))
        .then((answer) => {
          const repo = context.repos?.find((repo) => repo.name === answer);

          if (!repo || !repo.path) {
            throw new Error(
              `Cannot find the repository: "${answer}" in the project`
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

          return select<string>(
            selectWorktreeQuestion(worktrees.map((e) => `${e[0]} [${e[2]}]`))
          );
        })
        .then((answer) => {
          const [removeWorktreePath, branchName] = answer.split(" ");
          context.removeWorktrees = [
            [removeWorktreePath, "", branchName.replace(/\[(.*?)\]/g, "$1")],
          ];
          if (context.removeWorktrees[0][0] == context.selectedRepo?.path) {
            throw new Error(
              `Cannot remove "${context.command.arguments.branchName}", because it's inside the main worktree.\nTo remove a main worktree, use "wt unlink".`
            );
          }
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
      context.selectedRepo = repo;
      context.removeWorktrees = [
        [
          path.resolve(
            context.projectPath,
            `${context.command.options.repo}${path.sep}${context.command.arguments.branchName}`
          ),
          ,
          context.command.arguments.branchName,
        ],
      ];
      if (context.removeWorktrees[0][0] == repo?.path) {
        throw new Error(
          `Cannot remove "${context.command.arguments.branchName}", because it's inside the main worktree.\nTo remove a main worktree, use "wt unlink".`
        );
      }
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

      select<string>(
        selectWorktreeQuestion(worktrees.map((e) => `${e[0]} [${e[2]}]`))
      )
        .then((answer) => {
          const [removeWorktreePath, branchName] = answer.split(" ");
          context.removeWorktrees = [
            [removeWorktreePath, "", branchName.replace(/\[(.*?)\]/g, "$1")],
          ];
          if (removeWorktreePath == context.selectedRepo?.path) {
            throw new Error(
              `Cannot remove "${context.command.arguments.branchName}", because it's inside the main worktree.\nTo remove a main worktree, use "wt unlink".`
            );
          }
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

      if (context.removeWorktrees[0][0] == context.selectedRepo?.path) {
        throw new Error(
          `Cannot remove "${context.command.arguments.branchName}", because it's inside the main worktree.\nTo remove a main worktree, use "wt unlink".`
        );
      }
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

  context.projectConfigPath = normalizePath(
    gitConfig?.path
      ? gitConfig.path
      : path.resolve(context.cwd, EPROJECT_FILES.CONFIGURATION)
  );
  context.projectPath = normalizePath(
    gitConfig?.path ? path.dirname(gitConfig.path) : context.cwd
  );

  context.projectType = projectConfig.type;
  context.repos = projectConfig.repos;
  next();
}

function checkCreatePrerequisite(context: IContext, next: CallableFunction) {
  const repoPath = context.command.arguments.directory;
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

  context.projectPath = normalizePath(repoPath);
  context.projectType = context.command.options?.single
    ? EPROJECT_TYPE.SINGLE
    : EPROJECT_TYPE.MULTIPLE;
  context.repos = [];
  next();
}

function checkLinkPrerequisite(context: IContext, next: CallableFunction) {
  const [projectConfig, gitConfig] = getConfigs(context.cwd);
  checkIsInsideProject([projectConfig, gitConfig]);

  context.projectConfigPath = normalizePath(
    gitConfig?.path
      ? gitConfig.path
      : path.resolve(context.cwd, EPROJECT_FILES.CONFIGURATION)
  );
  context.projectPath = normalizePath(
    gitConfig?.path ? path.dirname(gitConfig.path) : context.cwd
  );

  context.projectType = projectConfig.type;
  context.repos = projectConfig.repos;

  if (context.repos.length && context.projectType === EPROJECT_TYPE.SINGLE) {
    throw new Error(ERROR_LINK_TO_SINGLE);
  }

  context.repos.forEach((repo: IRepo) => {
    if (repo.name === context.command.arguments.repoName) {
      throw new Error(ERROR_LINK_DUPLICATE(repo.name));
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
  context.projectConfigPath = normalizePath(
    gitConfig?.path
      ? gitConfig.path
      : path.resolve(context.cwd, EPROJECT_FILES.CONFIGURATION)
  );
  context.projectPath = normalizePath(
    gitConfig?.path ? path.dirname(gitConfig.path) : context.cwd
  );
  context.projectType = projectConfig.type;
  context.repos = projectConfig.repos;

  if (context.command.arguments.repoName) {
    next();
  } else {
    if (!context.repos?.length) {
      throw new Error("No linked repository");
    }
    select<string>(selectRepoQuestion(context.repos.map((repo) => repo.name)))
      .then((answer) => {
        context.command.arguments.repoName = answer;
        next();
      })
      .catch((error) => {
        ErrorProcessor.captureError(context, () => {
          throw error;
        });
      });
  }
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
};
