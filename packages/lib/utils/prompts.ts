import type { ListQuestion } from "inquirer";

export function selectBranchQuestion(branches: string[]): ListQuestion {
  return {
    type: "list",
    name: "branchName",
    message: "Select an available branch:",
    choices: branches,
  };
}

export function selectWorktreeQuestion(worktrees:string[]):ListQuestion{
  return {
    type:"list",
    name:"worktree",
    message:"Select a worktree:",
    choices:worktrees
  }
}
export function selectRepoQuestion(repos: string[]): ListQuestion {
  return {
    type: "list",
    name: "repoName",
    message: "Select a repository:",
    choices: repos,
  };
}


