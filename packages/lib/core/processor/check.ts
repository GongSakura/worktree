import * as path from "path";
import { checkIsGitDir, checkIsWorktree, getGitDir } from "../../utils/git";
import { getConfigs, getProjectFile } from "../../utils/file";
import { IMultiRepoWorktreePaths, PROJECT_FILES } from "../../utils/types";
import { readdirSync } from "fs";

function checkInitPrerequisite(context: any, next: CallableFunction) {
  const repoPath = context.cwd;

  if (checkIsGitDir(repoPath)) {
    throw new Error(`Cannot create inside the ".Git" folder`);
  }
  next();
}
function checkClonePrerequisite(context: any, next: CallableFunction) {
  checkInitPrerequisite(context, next);
}
function checkAddPrerequisite(context: any, next: CallableFunction) {
  const [projectConfig, worktreeConfig] = getConfigs(context.cwd);
  const repoInfo = Object.entries(projectConfig)[0];
  context.config = {
    projectConfigPath: worktreeConfig?.path
      ? worktreeConfig.path
      : path.resolve(context.cwd, "wt.config.json"),
    projectPath: worktreeConfig?.path
      ? path.dirname(worktreeConfig.path)
      : context.cwd,
    worktreePath: worktreeConfig?.path ? context.cwd : repoInfo[1],
    repoName: repoInfo[0],
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
  const [projectConfig, worktreeConfig] = getConfigs(context.cwd);
  const repoInfo = Object.entries(projectConfig)[0][1];
  context.config = {
    projectConfigPath: worktreeConfig?.path
      ? worktreeConfig.path
      : path.resolve(context.cwd, PROJECT_FILES.CONFIGURATION),
    projectPath: worktreeConfig?.path
      ? path.dirname(worktreeConfig.path)
      : context.cwd,
  };
  next();
}
function checkCreatePrerequisite(context: any, next: CallableFunction) {}

function inspectPotentialWorktrees(context: any, next: CallableFunction) {
  const files = readdirSync(context.config.projectPath);

  // TODO: feature suppport multi-repo
  const multiRepoWorktrees: IMultiRepoWorktreePaths = {};

  files.forEach((file) => {
    const _path = path.resolve(context.config.projectPath, file);

    if (checkIsWorktree(_path)) {
      const gitDirPath = getGitDir(_path);
      const idx = gitDirPath.lastIndexOf("/.git/worktrees");
      if (idx !== -1) {
        const key = gitDirPath.substring(0, idx);
        if (Object.hasOwn(multiRepoWorktrees, key)) {
          multiRepoWorktrees[key].push(_path);
        } else {
          multiRepoWorktrees[key] = [_path];
        }
      } else if (
        !Object.hasOwn(multiRepoWorktrees, gitDirPath.replace(/\/.git/, ""))
      ) {
        // main worktree path as the key
        multiRepoWorktrees[gitDirPath] = [];
      }
    }
  });

  let worktrees: string[][] = [];
  for (const [key, value] of Object.entries(multiRepoWorktrees)) {
    value.push(key);
    worktrees = value.map((e) => [e]);
    // FIXME: use the first worktree for single repo project
    break;
  }
  context.worktrees = worktrees;

  next();
}

export default {
  checkInitPrerequisite,
  checkClonePrerequisite,
  checkAddPrerequisite,
  checkRemovePrerequisite,
  checkUpdatePrerequisite,
  inspectPotentialWorktrees,
};
