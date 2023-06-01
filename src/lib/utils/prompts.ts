export function selectBranchQuestion(branches: string[]): any {
  return {
    message: "Select an available branch:",
    choices: branches.map((e: string) => {
      return {
        name: e,
        value: e,
      };
    }),
  };
}

export function selectWorktreeQuestion(worktrees: string[]): any {
  return {
    message: "Select a worktree:",
    choices: worktrees.map((e: string) => {
      return {
        name: e,
        value: e,
      };
    }),
  };
}

export function selectRepoQuestion(repos: string[]): any {
  return {
    message: "Select a repository:",
    choices: repos.map((e: string) => {
      return {
        name: e,
        value: e,
      };
    }),
  };
}
