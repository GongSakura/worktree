## Background

- 😘 Do you prefer to use **VS Code** to start your coding?
- 😡 Are you annoyed with the frequent **"git checkout/stash/pop"** during coding?
- 😭 Do you often **jump around** different projects(VS Code windows)?
- 🤪 Would you like a **natty gadget** to help you handle these messes? **Let's try it out!**

<br/>

## Install

```sh
npm i -g @kanamara/worktree
```

<br/>

## Usage
### 1. "wt init \<path\>"

- To initialize a worktree project that manages all git worktrees. If the path is not a git repository, it will create a new one via "git init <path>"

<br/>

### 2. "wt clone \<repo\> \<directory\>"

- To clone a git repository and initialize a worktree project."

<br/>

### 3. "wt add \<branch-name\>"

To add a worktree based on \<branch-name\>.

- If the \<branch-name\> has already been checkout, then the command will fail.
- If the \<branch-name\> doesn't existed, it will create a new branch based on HEAD
- If you want to create a worktree with a new branch that based on a commit or branch, use **"wt add --base \<commit-hash\> \<branch-name\>"**

<br/>

### 4. "wt rm \<branch-name\>"

- To remove a worktree based on the \<branch-name\>.

- If you want to remove the branch at the same time, use **"wt rm -f \<branch-name\>"**

<br/>

### 5. "wt update"

- To inspect all changes that related to "git branch" and "git worktree", then regenerate configuration and repair worktrees.

<br/>

### 6. "wt help"

- For more details.

<br/>

## Future support
 - TODO: Multiple git repositories
