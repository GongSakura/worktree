import { execSync } from "child_process";
import { WorktreeConfig } from "./types";

export function getWorktrees(cwdPath: string): [string, string, string][] {
    try {
      const stdout = execSync("git worktree list", {
        cwd: cwdPath,
        stdio: "pipe",
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
  export function enableWorktreeConfig(cwdPath: string): boolean {
    try {
      execSync("git config extensions.worktreeConfig true", {
        stdio: "pipe",
        cwd: cwdPath,
      });
      return true;
    } catch (error) {
      return false;
    }
  }
  export function getWorktreeConfiguration(cwdPath: string): WorktreeConfig {
    const config: WorktreeConfig = {};
    try {
      const stdout = execSync("git config --worktree --list", {
        cwd: cwdPath,
        stdio: ["ignore", "pipe", "pipe"],
      });
  
      stdout
        .toString()
        .trim()
        .split("\n")
        .forEach((e) => {
          const [k, v] = e.split("=");
          config[k.split(".").pop()] = v;
        });
    } catch (error) {
      console.log("getWorktreeConfiguration", error.stderr.toString());
    }
    return config;
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
        stdio: "pipe",
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
  
  export function getBranches(cwdPath: string): string[] {
    try {
      const stdout = execSync("git branch -a", {
        cwd: cwdPath,
        stdio: "pipe",
      })
        .toString()
        .trim();
      return stdout.split("\n").map(e=>e.split(' ').pop());
    } catch (error) {
      console.info(`getBranches error:`, error);
      return [];
    }
  }