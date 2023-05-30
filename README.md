A fast and natty tool automatically manages git worktrees. 🚀 whooooosh~

<br/>

## Motto

One window, all projects!

<br/>

## Background

- 😘 Do you prefer to use **VS Code** to start your coding? If not, you still can be benefited from it.
- 😡 Are you annoyed with the frequent **"git checkout/stash/pop"** during coding?
- 😭 Do you often **jump around** different projects(code editor windows)?
- 🤪 Would you like a **natty gadget** to help you handle these messes? **Let's try it out!**

<br/>

## Requirement

- node version >=14.18.0 (Due to the prefix "node:" in internal modules)

<br/>

## Install

```sh
npm i -g @kanamara/worktree
```

<br/>

## Usage

### 1. "wt init \<directory\>"

- To initialize a worktree project that manages all git worktrees. If the directory is not a git repository, it will create a new one via **"git init \<directory\>"**

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
- If you want to remove the branch at the same time, use **"wt rm -f \<branch-name\>"**.

<br/>

### 5. "wt update"

- To inspect all changes that related to "git branch" and "git worktree", then regenerate configuration and repair worktrees.

<br/>

### 6. "wt help"

- For more details.

<br/>

## Kind Reminder

- This tool will generate some folders and configuration files to help you automatically manage your worktrees, please do not change the name of these files and folders. If you accidentally changed it, use "wt update" to repair it.

- For convenience, worktree directories inside a **single-repo** project are named after the \<branch-name\>

  ```text
  project(single-repo)/
  ├─ <branch-name>/
  ├─ <branch-name>/
  ├─ ...
  ├─ <branch-name>/
  ├─ wt.config.json
  ├─ wt.code-workspace
  ```

- If worktree directories are inside a **multi-repos** project, then named after \<repo-name\>#\<branch-name\>
  ```text
  project(multi-repos)/
  ├─ <repo-name>#<branch-name>/
  ├─ <repo-name>#<branch-name>/
  ├─ ...
  ├─ <repo-name>#<branch-name>/
  ├─ wt.config.json
  ├─ wt.code-workspace
  ```

<br/>

## Future support

- TODO: Multiple git repos
- TODO: Inquirer prompts for add/remove worktree
- TODO: Elegant error handle

<br/>
