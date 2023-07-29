import * as path from "node:path";
import {
  checkIsGitDir,
  getUncheckoutBranches,
  getWorktrees,
} from "../../utils/git";
import { getConfigs, getProjectFile, normalizePath } from "../../utils/file";
import {
  PROJECT_FILES,
  PROJECT_TYPE as PROJECT_TYPE,
  IProjectConfig,
  IGitConfig,
  IContext,
  IRepo,
} from "../../utils/types";
import { mkdirSync, statSync } from "node:fs";
import select from "@inquirer/select";
import {
  selectBranchQuestion,
  selectRepoQuestion,
  selectWorktreeQuestion,
} from "../../utils/prompts";
import { ErrorProcessor } from "../index";
import {
  ERROR_MISSING_CONFIG_TYPE,
  ERROR_CREATE_IN_DIR,
  ERROR_CREATE_IN_GITDIR,
  ERROR_EMPTY_REPOS,
  ERROR_EXECUTE_IN_GITDIR,
  ERROR_EXECUTE_OUTSIDE,
  ERROR_LINK_DUPLICATE,
  ERROR_LINK_TO_SINGLE,
  ERROR_MISSING_CONFIG,
  ERROR_MISSING_OPTION_REPO,
  ERROR_MISSING_ARGS_BRANCH_NAME,
  ERROR_REPO_NOT_EXSITED,
  ERROR_NO_AVAILABLE_BRANCH,
  ERROR_REMOVE_WORKTREE,
  ERROR_REMOVE_MAIN_WORKTREE,
  ERROR_INIT_EXISTED,
} from "../../utils/constants";

function checkInitPrerequisite(context: IContext, next: CallableFunction) {
  const repoPath = normalizePath(context.command.arguments.directory);
  if (checkIsGitDir(repoPath)) {
    throw new Error(ERROR_EXECUTE_IN_GITDIR);
  }

  const projectConfig = getConfigs(repoPath);
  if (projectConfig) {
    throw new Error(ERROR_INIT_EXISTED(repoPath));
  }

  context.projectConfigPath = normalizePath(
    path.resolve(repoPath, PROJECT_FILES.CONFIGURATION)
  );

  context.projectPath = repoPath;
  context.projectType = PROJECT_TYPE.SINGLE;

  next();
}

function checkClonePrerequisite(context: IContext, next: CallableFunction) {
  checkInitPrerequisite(context, next);
}

async function checkAddPrerequisite(context: IContext, next: CallableFunction) {
  const projectConfig = getConfigs(context.cwd);

  checkIsConfigVaild(projectConfig);

  context.projectConfig = projectConfig;
  context.projectConfigPath = normalizePath(
    path.resolve(projectConfig!.projectPath, PROJECT_FILES.CONFIGURATION)
  );
  context.projectPath = normalizePath(projectConfig!.projectPath);
  context.repos = projectConfig!.repos;
  context.projectType = projectConfig!.type;

  if (!context.command.arguments.branchName) {
    if (context.projectType === PROJECT_TYPE.MULTIPLE) {
      const answer = await select<string>(
        selectRepoQuestion(context.repos.map((repo) => repo.name))
      );
      const repo = context.repos?.find((repo) => repo.name === answer);
      if (!repo || !repo.path) {
        throw new Error(ERROR_REPO_NOT_EXSITED(answer));
      }
      context.selectedRepo = repo;
    } else {
      context.selectedRepo = context.repos[0];
    }

    // check if has any available branch
    const uncheckoutBranches = getUncheckoutBranches(
      context.selectedRepo.path!
    );

    if (!uncheckoutBranches.length) {
      throw new Error(ERROR_NO_AVAILABLE_BRANCH(context.selectedRepo.name));
    }

    const answer = await select<string>(
      selectBranchQuestion(uncheckoutBranches)
    );
    context.command.arguments.branchName = answer;
  } else {
    if (context.projectType === PROJECT_TYPE.MULTIPLE) {
      if (!context.command.options.repo) {
        throw new Error(ERROR_MISSING_OPTION_REPO);
      }

      const repo = context.repos?.find(
        (repo) => repo.name === context.command.options.repo
      );

      if (!repo || !repo.path) {
        throw new Error(ERROR_REPO_NOT_EXSITED(context.command.options.repo));
      }
      context.selectedRepo = repo;
    } else {
      context.selectedRepo = context.repos[0];
    }
  }

  next();
}

async function checkRemovePrerequisite(
  context: IContext,
  next: CallableFunction
) {
  const projectConfig = getConfigs(context.cwd);
  checkIsConfigVaild(projectConfig);

  context.projectConfig = projectConfig;
  context.projectConfigPath = normalizePath(
    path.resolve(projectConfig!.projectPath, PROJECT_FILES.CONFIGURATION)
  );
  context.projectPath = normalizePath(projectConfig!.projectPath);
  context.repos = projectConfig!.repos;
  context.projectType = projectConfig!.type;

  if (!context.command.arguments.branchName) {
    if (context.projectType === PROJECT_TYPE.MULTIPLE) {
      const answer = await select<string>(
        selectRepoQuestion(context.repos.map((repo) => repo.name))
      );
      const repo = context.repos?.find((repo) => repo.name === answer);
      if (!repo || !repo.path) {
        throw new Error(ERROR_REPO_NOT_EXSITED(answer));
      }
      context.selectedRepo = repo;
    } else {
      context.selectedRepo = context.repos[0];
    }

    const worktrees: string[][] = getWorktrees(
      context.selectedRepo.path!
    ).reverse();

    // skip the main worktree
    worktrees.pop();
    if (!worktrees.length) {
      throw new Error(ERROR_REMOVE_WORKTREE);
    }

    const answer = await select<string>(
      selectWorktreeQuestion(worktrees.map((e) => `${e[0]} [${e[2]}]`))
    );

    const [removeWorktreePath, branchName] = answer.split(" ");
    context.removeWorktrees = [
      [removeWorktreePath, "", branchName.replace(/\[(.*?)\]/g, "$1")],
    ];
    if (removeWorktreePath == context.selectedRepo?.path) {
      throw new Error(
        ERROR_REMOVE_MAIN_WORKTREE(context.command.arguments.branchName)
      );
    }
  } else {
    if (context.projectType === PROJECT_TYPE.MULTIPLE) {
      if (!context.command.options.repo) {
        throw new Error(ERROR_MISSING_OPTION_REPO);
      }

      const repo = context.repos?.find(
        (repo) => repo.name === context.command.options.repo
      );

      if (!repo || !repo.path) {
        throw new Error(ERROR_REPO_NOT_EXSITED(context.command.options.repo));
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
    } else {
      context.selectedRepo = context.repos[0];
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
    }

    if (context.removeWorktrees[0][0] == context.selectedRepo?.path) {
      throw new Error(
        ERROR_REMOVE_MAIN_WORKTREE(context.command.arguments.branchName)
      );
    }
  }
  next();

  //TODO:

  if (context.projectType === PROJECT_TYPE.MULTIPLE) {
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
  const projectConfig = getConfigs(context.cwd);
  checkIsConfigVaild(projectConfig);

  context.projectConfig = projectConfig;
  context.projectConfigPath = normalizePath(
    path.resolve(projectConfig!.projectPath, PROJECT_FILES.CONFIGURATION)
  );
  context.projectPath = normalizePath(projectConfig!.projectPath);
  context.repos = projectConfig!.repos;
  context.projectType = projectConfig!.type;

  next();
}

function checkCreatePrerequisite(context: IContext, next: CallableFunction) {
  const repoPath = context.command.arguments.directory;
  if (checkIsGitDir(repoPath)) {
    throw new Error(ERROR_CREATE_IN_GITDIR);
  }

  const projectConfig = getConfigs(repoPath);
  if (projectConfig) {
    throw new Error(ERROR_INIT_EXISTED(repoPath));
  }

  try {
    const stat = statSync(repoPath);
    if (stat.isFile()) {
      throw new Error(ERROR_CREATE_IN_DIR(repoPath));
    }
  } catch {
    mkdirSync(repoPath);
  }

  context.projectPath = normalizePath(repoPath);
  context.projectType = context.command.options?.single
    ? PROJECT_TYPE.SINGLE
    : PROJECT_TYPE.MULTIPLE;
  context.repos = [];
  next();
}

function checkLinkPrerequisite(context: IContext, next: CallableFunction) {
  const projectConfig = getConfigs(context.cwd);
  checkIsConfigVaild(projectConfig);
  context.projectConfig = projectConfig;
  context.projectConfigPath = normalizePath(
    path.resolve(projectConfig!.projectPath, PROJECT_FILES.CONFIGURATION)
  );
  context.projectPath = normalizePath(projectConfig!.projectPath);
  context.repos = projectConfig!.repos;
  context.projectType = projectConfig!.type;

  if (context.projectType === PROJECT_TYPE.SINGLE) {
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

async function checkUnlinkPrerequisite(
  context: IContext,
  next: CallableFunction
) {
  const projectConfig = getConfigs(context.cwd);
  checkIsConfigVaild(projectConfig);
  context.projectConfig = projectConfig;
  context.projectConfigPath = normalizePath(
    path.resolve(projectConfig!.projectPath, PROJECT_FILES.CONFIGURATION)
  );
  context.projectPath = normalizePath(projectConfig!.projectPath);
  context.repos = projectConfig!.repos;
  context.projectType = projectConfig!.type;

  if (!context.command.arguments.repoName) {
    if (!context.repos?.length) {
      throw new Error(ERROR_EMPTY_REPOS);
    }

    const answer = await select<string>(
      selectRepoQuestion(context.repos.map((repo) => repo.name))
    );
    context.command.arguments.repoName = answer;
  }

  next();
}

/**
 * To verify if user execute commands within a worktree project
 * 1. check if wt.config.json is not empty
 * 2. check if
 * @param configs wt.config.json & git config --list
 */
function checkIsConfigVaild(configs?: IProjectConfig) {
  if (!configs) {
    throw new Error(ERROR_EXECUTE_OUTSIDE);
  }
  if (configs.type === undefined) {
    throw new Error(ERROR_MISSING_CONFIG_TYPE);
  }
  if (!configs.repos?.length && configs.type === PROJECT_TYPE.SINGLE) {
    throw new Error(ERROR_EMPTY_REPOS);
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
