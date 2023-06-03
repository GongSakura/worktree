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

**Step 1.** To create a directory to manage multiple branches of a repository. There are two ways:

```bash
# The first way: to create a directory from a local git repository.
wt init <directory>

# e.g.
# repository path: "/path/to/repo"
wt init /path/to/repo
```

```bash
# The second way: to create a directory from a remote git repository.
wt clone <repository> <directory>

# e.g.
# repository url: "https://github.com/repo.git"
# directory: "/path/to/project"
wt clone https://github.com/repo.git /path/to/project
```

<br/>

**Step 2.** To add a worktree

```bash
# To add a new worktree, and checkout the "dev" branch;
# If the branch "dev" doesn't exist, it will create a new one base on HEAD(current commit).
wt add dev
```

  <br/>

### Scenario: **"Multiple repositories, multiple branches"**

**Step 1.** To create a directory to manage multiple branches from multiple repositories.

```bash
# Create an empty directory in the path:"/path/to/project"
wt create /path/to/project
```

<br/>

**Step 2.** Link a repository to the directory

```bash
# Link a local git repository from "/path/to/repo", and name the repository as "foo"
wt link /path/to/repo foo

# Then, you will see some changes in the "wt.config.json" file.
# {
#  repos:[{
#       path:"/path/to/repo"
#       name:"foo"
#      }],
#  type:"multiple"
# }
```

**Step 3.** To add a worktree

```bash
# add a worktree for the repo "foo", and checkout the "dev" branch.
wt add --repo foo dev
```

<br/>

## Usage

### 1. "wt init \<directory\>"

To initialize a directory from local repository, which manages all git worktrees. If the directory is not a git repository, it will help you to create a new one via **"git init \<directory\>"**

- **Only for "single-repo" projects**

<br/>

### 2. "wt clone \<repo-url\> \<directory\>"

To clone a git repository to the directory and initialize it.

- **Only for "single-repo" projects**

<br/>

### 3. "wt add \<branch-name\>"

To add a worktree based on \<branch-name\>.

- If the \<branch-name\> is not specified, then it gives you a **prompt**.
- If the \<branch-name\> doesn't exist in git branches, it will create a new branch based on HEAD
- If you want to create a worktree with a new branch based on a commit or branch, use **"wt add --base \<commit-hash\> \<branch-name\>"**

<br/>

### 4. "wt rm \<branch-name\>"

To remove a worktree based on the \<branch-name\>.

- If the \<branch-name\> is not specified, then it gives you a **prompt**.
- If you want to remove the branch at the same time, use **"wt rm -f \<branch-name\>"**.

<br/>

### 5. "wt create \<directory\>"

To create an **empty** directory for users to parallelly develop multiple branches of multiple repositories.

- To use **"wt link"** to add repositories to the directory.
- To use **--single** option to create one for single repository

<br/>

### 6. "wt link \<repo-url\> \<repo-name\>"

To add a git repository to the directory. The \<repo-url\> can be a **directory path**, and the \<repo-name\> will be used as the name(id) of the repository.

<br/>

### 7. "wt unlink \<repo-name\>"

To remove a git repository from the current directory.

- If the \<repo-name\> is not specified, then it gives you a **prompt**.

<br/>

### 8. "wt update"

- To inspect all changes related to "git branch" and "git worktree", then regenerate configuration and repair worktrees.

<br/>

## Kind Reminder

- This tool will generate some folders and configuration files to help you automatically manage your worktrees, please do not change the name of these files and folders. If you accidentally changed it, use "wt update" to repair it.

- For convenience, worktree directories inside a **single-repo** project are named after the \<branch-name\>

  ```text
  project/
  ├─ <branch-name>/
  ├─ <branch-name>/
  ├─ ...
  ├─ <branch-name>/
  ├─ wt.config.json
  ├─ wt.code-workspace
  ```

- If worktree directories are inside a **multi-repos** project, then it will look like this:
  ```text
  project/
  ├─ <repo-name>/
        ├─ <branch-name>/
        ├─ <branch-name>/
  ├─ ...
  ├─ <repo-name>/
        ├─ <branch-name>/
        ├─ <branch-name>/
  ├─ wt.config.json
  ├─ wt.code-workspace
  ```

<br/>

## Future todo

- More informative and elegant error processor
- Description of "wt.config.json"
- Extra features of "wt.config.json"


<br/>

## Welcome to contribute and raise issues

https://github.com/GongSakura/worktree

<br/>
