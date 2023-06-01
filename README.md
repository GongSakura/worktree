A fast and natty tool automatically manages git worktrees for multiple repositories. 🚀 whooooosh~

<br/>

## Motto

One window, all projects!

<br/>

## Background

- 😘 Do you prefer to use **VS Code** to start your coding? If not, you still can be benefited from it.
- 😡 Are you annoyed with the frequent **"git switch/checkout/stash/pop"** during coding?
- 😭 Do you often **jump around** different projects(code editor windows)?
- 🤪 Would you like a **natty gadget** to help you handle these messes? **Let's try it out!**

<br/>

## Feature

- simple command & **friendly prompt**
- **automatically** manage worktrees(add/remove/repair)
- support **multiple** repositories

<br/>

## Install
node version >=14.18.0 (Due to the prefix "node:" in internal modules)
```sh
npm i -g @kanamara/worktree
```

<br/>

## Quick Start

### Scenario: **"Single repository, multiple branches"**

- To create a project to manage multiple branches of a repository. There are two ways:

  ```bash
  # To create the project from a local git repository.
  # If the directory is not a git repository, it will execute "git init <directory>"
  wt init <directory>

  # or:

  # To create the project from a remote git repository.
  wt clone <repository> <directory>
  ```

<br/>

- To add a worktree

  ```bash
  # To add a new worktree, and checkout the "dev" branch;
  # If the branch "dev" doesn't exist, it will create a new one base on HEAD(current commit).
  wt add dev

  # or:

  # Suppose it has some remote branches in the repository
  git branch -a
  remotes/origin/feature-1
  remotes/origin/feature-2
  remotes/origin/feature-3

  # To add a worktree "my-dev" based on the "feature-2" branch
  wt add --base remotes/origin/feature-2 my-dev
  ```

  <br/>

### Scenario: **"Multiple repositories, multiple branches"**

- To create a project to manage multiple branches from multiple repositories.

  ```bash
  # Create an empty project to the path:"/path/to/my-project"
  wt create /path/to/my-project

  # Link a git repository from a local path:"/local-path/to/git-repository", and name after "my-frontend"
  wt link /local-path/to/git-repository my-frontend
  ```

<br/>

- To add a worktree
  ```bash
  # add a worktree for the repo "my-frontend", and checkout the "dev" branch.
  wt add --repo my-frontend dev
  ```

<br/>

## Usage

### 1. "wt init \<directory\>"

To initialize a worktree project that manages all git worktrees. If the directory is not a git repository, it will create a new one via **"git init \<directory\>"**

- **Only for "single-repo" projects**

<br/>

### 2. "wt clone \<repo-url\> \<directory\>"

To clone a git repository and initialize a worktree project.

- **Only for "single-repo" projects**

<br/>

### 3. "wt add \<branch-name\>"

To add a worktree based on \<branch-name\>.

- If the \<branch-name\> is not specified, then it give you a **prompt**.
- If the \<branch-name\> doesn't exist in git branches, it will create a new branch based on HEAD
- If you want to create a worktree with a new branch based on a commit or branch, use **"wt add --base \<commit-hash\> \<branch-name\>"**

<br/>

### 4. "wt rm \<branch-name\>"

To remove a worktree based on the \<branch-name\>.

- If the \<branch-name\> is not specified, then it give you a **prompt**.
- If you want to remove the branch at the same time, use **"wt rm -f \<branch-name\>"**.

<br/>

### 5. "wt create \<directory\>"

To create an **empty** worktree project for users to parallelly develop multiple branches in multiple repositories.

- To use **"wt link"** to add git repositories to the project.
- **Only for "multi-repos" projects**

<br/>

### 6. "wt link \<repo-url\> \<repo-name\>"

To add a git repository to the project. The \<repo-url\> can be a **directory path**, and the \<repo-name\> will be used as the name(id) of the repository.

- **Only for "multi-repos" projects**

<br/>

### 7. "wt unlink \<repo-name\>"

To remove a git repository from the current project.

- If the \<repo-name\> is not specified, then it give you a **prompt**.
- **Only for "multi-repos" projects**

<br/>

### 8. "wt update"

- To inspect all changes related to "git branch" and "git worktree", then regenerate configuration and repair worktrees.

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

## Future

- TODO: More informative and elegant error processor
- TODO: Description of "wt.config.json"
- TODO: Extra features of "wt.config.json"


<br/>

## Welcome to contribute and raise issues
https://github.com/GongSakura/worktree

<br/>
