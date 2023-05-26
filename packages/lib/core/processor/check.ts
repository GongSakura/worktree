import * as path from "node:path";
import {
  checkIsGitDir,
  checkIsMainWorktree,
  checkIsWorktree,
  getGitDir,
  getWorktrees,
} from "../../utils/git";
import { getConfigs, getProjectFile } from "../../utils/file";
import { MultiRepoWorktreePaths, PROJECT_FILES } from "../../utils/types";
import { readFileSync, readdirSync, statSync } from "node:fs";

function checkInitPrerequisite(context: any, next: CallableFunction) {
  const repoPath = context.cwd;
  if (checkIsGitDir(repoPath)) {
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
function checkClonePrerequisite(context: any, next: CallableFunction) {
  checkInitPrerequisite(context, next);
}

function checkAddPrerequisite(context: any, next: CallableFunction) {
  const [projectConfig, worktreeConfig] = getConfigs(context.cwd);
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
  const [projectConfig, worktreeConfig] = getConfigs(context.cwd);
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
  next();
}

function inspectPotentialWorktrees(context: any, next: CallableFunction) {
  const files = readdirSync(context.config.projectPath);

  // TODO: feature suppport multi-repo
  const multiRepoWorktrees: MultiRepoWorktreePaths = {};

  files.forEach((file) => {
    const _path = path.resolve(context.config.projectPath, file);

    if (checkIsWorktree(_path)) {
      try {
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
      } catch (error) {
        console.info(`error:`, error);
      }
    }
  });
  // console.info(`multiRepoWorktrees:`, multiRepoWorktrees);
  let worktrees:string[][] = []
  for(const [key,value] of Object.entries(multiRepoWorktrees)){
    value.push(key)
    worktrees=value.map(e=>[e])
  }
  context.worktrees = worktrees
  next()
}

export default {
  checkInitPrerequisite,
  checkAddPrerequisite,
  checkRemovePrerequisite,
  checkUpdatePrerequisite,
  inspectPotentialWorktrees,
};
