import * as path from "node:path";
import {
  checkIsMainWorktree,
  checkIsWorktree,
  getGitDir,
  getWorktreeConfiguration,
} from "../../utils/git";
import { getProjectFile } from "../../utils/file";
import { PROJECT_FILES, WorktreeConfig } from "../../utils/types";

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
  const projectConfig = getProjectFile(
    context.cwd,
    PROJECT_FILES.CONFIGURATION
  );
  let config: WorktreeConfig = {};
  if (!projectConfig.mainWorktreePath) {
    config = getWorktreeConfiguration(context.cwd);
    if (!config.path) {
      throw new Error("Current working directory has not been initialized");
    }
  }
  context.config = {
    ...projectConfig,
    projectConfigPath: config?.path
      ? config.path
      : path.resolve(context.cwd, "wt.config.json"),
    projectPath: config?.path ? path.dirname(config.path) : context.cwd,
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
function checkClonePrerequisite(context: any, next: CallableFunction) {}
export default {
  checkInitPrerequisite,
  checkAddPrerequisite,
  checkRemovePrerequisite,
};
