/**
 * Handle all git commands
 */

import { execSync } from "node:child_process";
import * as path from "node:path";

function initRepository(context: any, next: CallableFunction) {
  const repoPath = context.commandArgumetns.directory;

  if (getGitDir(repoPath)) {
    console.log("cannot initialize in a git directory");
    return;
  }

  if (checkIsWorktree(repoPath)) {
    context.isMainWorktree = checkIsMainWorktree(repoPath);
  } else {
    context.isMainWorktree = true;
  }

  const command =
    "git init " +
    (context?.commendOptions?.separateGitDir
      ? `--separate-git-dir ${context.commendOptions.separateGitDir} `
      : " ") +
    (context?.commendOptions?.branch
      ? `-b ${context.commendOptions.branch} `
      : " ") +
    repoPath;

  try {
    execSync(command, { stdio: "ignore" });
    const worktrees = getWorktree(repoPath);
    context.workTrees = worktrees.reverse();
    context.gitDir = getGitDir(path.resolve(repoPath, "./.git"));

    next();
  } catch (error) {}
}
function repairWorktree(context: any, next: CallableFunction) {
  const workTrees = context.workTrees;
  const mainWorkTreePath = workTrees.pop()[0]
  const linkedWorktreePaths = workTrees.reduce((prev,cur)=>{
    return `${prev} ${cur[0]}`
  },'') 
  try{
    execSync('git worktree repair '+linkedWorktreePaths,{
      cwd:mainWorkTreePath
    })
  }catch(error){
    console.info(`RepairWorktree error:`,error)
  }
}

export function getWorktree(cwdPath: string): [string, string, string][] {
  try {
    const stdout = execSync("git worktree list", {
      cwd: cwdPath,
      stdio: ["ignore", "pipe", "ignore"],
    }).toString();

    const worktrees = stdout.trim().split("\n");
    return worktrees.map((e) => {
      const [, worktreePath, commitHash, branch] = e.match(
        /^(\S+)\s+(\w+)\s+(\[[^\]]+\])$/
      );
      return [worktreePath, commitHash, branch.replace(/\[(.*?)\]/g, "$1")];
    });
  } catch (error) {
    throw error;
  }
}
export function checkIsWorktree(cwdPath: string): boolean {
  try {
    const output = execSync("git rev-parse --is-inside-work-tree ", {
      cwd: cwdPath,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output.toString() ? true : false;
  } catch (error) {
    return false;
  }
}
export function checkIsMainWorktree(cwdPath: string): boolean {
  try {
    const stdout = execSync("git rev-parse --absolute-git-dir", {
      cwd: cwdPath,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return !stdout.includes(".git/worktree");
  } catch (error) {
    return false;
  }
}

export function getGitDir(repoPath: string): string {
  try {
    const output = execSync("git rev-parse --resolve-git-dir " + repoPath, {
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output.toString().trim();
  } catch (error) {
    return "";
  }
}
export function setGitDir(cwdPath: string, gitDirPath: string) {
  try {
    execSync("git init --separate-git-dir=" + gitDirPath, {
      cwd: cwdPath,
    });
  } catch {}
}
export function checkIsGitDir(cwdPath: string): boolean {
  try {
    const output = execSync("git rev-parse --is-inside-git-dir ", {
      cwd: cwdPath,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output.toString() ? true : false;
  } catch (error) {
    return false;
  }
}

export default {
  initRepository,
  repairWorktree,
};
