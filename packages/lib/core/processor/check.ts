import * as path from "node:path";
import {
  checkIsMainWorktree,
  checkIsWorktree,
  getGitDir,
  getWorktreeConfiguration,
  getWorktrees,
} from "../../utils/git";
import { getProjectFile } from "../../utils/file";
import {
  PROJECT_FILES,
  ProjectConfig,
  WorktreeConfig,
} from "../../utils/types";

function checkInitPrerequisite(context: any, next: CallableFunction) {
  const repoPath = context.cwd;
  if (getGitDir(repoPath)) {
    throw new Error("cannot initialize in a git directory");
  }

  // FIXME: deal with donot know if can initial inside a linked worktree
  if (checkIsWorktree(repoPath)) {
    context.isMainWorktree = checkIsMainWorktree(repoPath);
  } else {
    context.isMainWorktree = true;
  }
  next();
}
function checkAddPrerequisite(context: any, next: CallableFunction) {
  const [projectConfig, worktreeConfig] = getConfig(context.cwd);
  context.config = {
    ...projectConfig,
    projectConfigPath: worktreeConfig?.path
      ? worktreeConfig.path
      : path.resolve(context.cwd, "wt.config.json"),
    projectPath: worktreeConfig?.path
      ? path.dirname(worktreeConfig.path)
      : context.cwd,
    worktreePath: worktreeConfig?.path
      ? context.cwd
      : projectConfig.mainWorktreePath,
  };

  context.codeWorkspace = getProjectFile(
    context.config.projectPath,
    PROJECT_FILES.CODE_WORKSPACE
  );
  next();
}

function checkRemovePrerequisite(context: any, next: CallableFunction) {
  checkAddPrerequisite(context, next);
}
function checkUpdatePrerequisite(context: any, next: CallableFunction) {
  const [projectConfig, worktreeConfig] = getConfig(context.cwd);
  context.config = {
    ...projectConfig,
    projectConfigPath: worktreeConfig?.path
      ? worktreeConfig.path
      : path.resolve(context.cwd, "wt.config.json"),
    projectPath: worktreeConfig?.path
      ? path.dirname(worktreeConfig.path)
      : context.cwd,
    worktreePath: worktreeConfig?.path
      ? context.cwd
      : projectConfig.mainWorktreePath,
  };
  console.info(`context.worktrees:`,context)
  context.worktrees = getWorktrees(context.config.worktreePath).reverse();
 
}

function checkClonePrerequisite(context: any, next: CallableFunction) {}

export function getConfig(cwdPath: string): [ProjectConfig, WorktreeConfig] {
  const projectConfig: ProjectConfig = getProjectFile(
    cwdPath,
    PROJECT_FILES.CONFIGURATION
  );
  let worktreeConfig: WorktreeConfig = {};
  if (!projectConfig.mainWorktreePath) {
    worktreeConfig = getWorktreeConfiguration(cwdPath);
    if (!worktreeConfig.path) {
      throw new Error("Current working directory has not been initialized");
    }
  }
  return [projectConfig, worktreeConfig];
}

export default {
  checkInitPrerequisite,
  checkAddPrerequisite,
  checkRemovePrerequisite,
  checkUpdatePrerequisite,
};
