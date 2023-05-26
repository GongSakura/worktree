

## Installation

```sh
npm i -g @kanamara/worktree
```

<br/>

## Commands

### 1. "wt init \<path\>"
To initialize a worktree project that manages all git worktrees. If the path is not a git repository, it will create a new one via "git init <path>"

<br/>

### 2. "wt add \<branch-name\>"
To add a worktree based on \<branch-name\>. 
- If the \<branch-name\> has been already checkout, then the command will fail.
- If the \<branch-name\> doesn't existed, it will create a new branch based on HEAD
- If you want to create a worktree with a new branch that based on a commit or branch, use **"wt add --base \<commit-hash\> \<branch-name\>"**

<br/>

### 3. "wt rm \<branch-name\>"
To remove a worktree based on the \<branch-name\>.
- If you want to remove the branch at the same time, use **"wt rm -f \<branch-name\>"**

<br/>

### 4. "wt update"(under developing)
To inspect all changes that related to "git branch" and "git worktree", then regenerate configuration and repair worktrees.

<br/>


### 5. "wt help"
For more details.