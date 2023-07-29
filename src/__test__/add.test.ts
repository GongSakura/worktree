import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import { randomUUID } from "node:crypto";
import { mkdir, rm, readdir } from "node:fs/promises";
import path from "node:path";
import { mockGitRepository, run } from "./utils";
import { checkIsPathCaseSensitive, normalizePath } from "../lib/utils/file";
import { PROJECT_FILES } from "../lib/utils/types";
import { getAllBranches } from "../lib/utils/git";

global.isPathCaseSensitive = checkIsPathCaseSensitive();

describe("add from single-repo project", () => {
  const program: string = normalizePath(path.resolve("build/index.js"));
  const testPath: string = normalizePath(
    path.resolve(
      path.dirname(process.cwd()),
      ".test_" + randomUUID().split("-")[0]
    )
  );
  const mockGitRepoPath: string = normalizePath(
    path.resolve(testPath, randomUUID().split("-")[0])
  );

  const projectPath: string = mockGitRepoPath;
  const repoPath: string = path.resolve(projectPath, "mock");
  const worktrees: string[] = [];

  beforeAll(async () => {
    await mkdir(testPath);
    await mockGitRepository(mockGitRepoPath);
    await run(program, `init ${mockGitRepoPath}`);
  });

  afterAll(async () => {
    await rm(testPath, {
      recursive: true,
    });
  });

  it("setup", async () => {
    // ======= check branches =======
    const branches = getAllBranches(repoPath);
    expect(new Set(branches)).toEqual(
      new Set(["mock", "feature-1", "feature-2"])
    );

    // ======= check project directory =======
    const projectFiles = await readdir(projectPath);
    expect(new Set(projectFiles)).toEqual(
      new Set([
        PROJECT_FILES.CODE_WORKSPACE,
        PROJECT_FILES.CONFIGURATION,
        "mock",
      ])
    );
  });

  it("add a worktree based on a new branch", async () => {
    try {
      const mockBranch = randomUUID().split("-")[0];
      worktrees.push(mockBranch);
      const branchPath = normalizePath(path.resolve(projectPath, mockBranch));

      await run(program, `add ${mockBranch}`, {
        cwd: projectPath,
      });

      // ======= check branches =======
      const branches = getAllBranches(repoPath);
      expect(new Set(branches)).toEqual(
        new Set([...worktrees, "mock", "feature-1", "feature-2"])
      );

      // ======= check project directory =======
      const projectFiles = await readdir(projectPath);
      expect(new Set(projectFiles)).toEqual(
        new Set([
          PROJECT_FILES.CODE_WORKSPACE,
          PROJECT_FILES.CONFIGURATION,
          ...worktrees,
          "mock",
        ])
      );

      // ======= check branch directory =======
      const branchFiles = await readdir(branchPath);
      expect(new Set(branchFiles)).toEqual(new Set(["README.md", ".git"]));
    } catch (error) {
      throw error;
    }
  });

  it("add a worktree based on an existed branch", async () => {
    try {
      const existedBranch = "feature-1";
      worktrees.push(existedBranch);
      const branchPath = normalizePath(
        path.resolve(projectPath, existedBranch)
      );

      await run(program, `add ${existedBranch}`, {
        cwd: projectPath,
      });

      // ======= check branches =======
      const branches = getAllBranches(repoPath);
      expect(new Set(branches)).toEqual(
        new Set([...worktrees, "mock", "feature-1", "feature-2"])
      );

      // ======= check project directory =======
      const projectFiles = await readdir(projectPath);
      expect(new Set(projectFiles)).toEqual(
        new Set([
          PROJECT_FILES.CODE_WORKSPACE,
          PROJECT_FILES.CONFIGURATION,
          ...worktrees,
          "mock",
        ])
      );

      // ======= check branch directory =======
      const branchFiles = await readdir(branchPath);
      expect(new Set(branchFiles)).toEqual(
        new Set(["README.md", "feature-1.md", ".git"])
      );
    } catch (error) {
      throw error;
    }
  });

  it("add a worktree based on a new branch which is from an existed branch", async () => {
    try {
      const mockBranch = randomUUID().split("-")[0];
      worktrees.push(mockBranch);
      const branchPath = normalizePath(path.resolve(projectPath, mockBranch));

      await run(program, `add --base feature-2 ${mockBranch}`, {
        cwd: projectPath,
      });

      // ======= check branches =======
      const branches = getAllBranches(repoPath);
      expect(new Set(branches)).toEqual(
        new Set([...worktrees, "mock", "feature-1", "feature-2"])
      );

      // ======= check project directory =======
      const projectFiles = await readdir(projectPath);
      expect(new Set(projectFiles)).toEqual(
        new Set([
          PROJECT_FILES.CODE_WORKSPACE,
          PROJECT_FILES.CONFIGURATION,
          ...worktrees,
          "mock",
        ])
      );

      // ======= check branch directory =======
      const branchFiles = await readdir(branchPath);
      expect(new Set(branchFiles)).toEqual(
        new Set(["README.md", "feature-2.md", ".git"])
      );
    } catch (error) {
      throw error;
    }
  });
});

describe("add from multi-repos project", () => {
  const program: string = normalizePath(path.resolve("build/index.js"));
  const testPath: string = normalizePath(
    path.resolve(
      path.dirname(process.cwd()),
      ".test_" + randomUUID().split("-")[0]
    )
  );
  const mockGitRepoPath: string = normalizePath(
    path.resolve(testPath, randomUUID().split("-")[0])
  );
  const mockRepoName = mockGitRepoPath
    .replace(/\.git/, "")
    .split(path.sep)
    .pop()!;
  const projectPath: string = normalizePath(
    path.resolve(testPath, randomUUID().split("-")[0])
  );
  const repoPath: string = path.resolve(
    projectPath,
    mockRepoName + path.sep + "mock"
  );
  const worktrees: string[] = [];

  beforeAll(async () => {
    await mkdir(testPath);
    await mockGitRepository(mockGitRepoPath);
    await run(program, `create ${projectPath}`);
    await run(program, `link ${mockGitRepoPath} ${mockRepoName}`, {
      cwd: projectPath,
    });
  });

  afterAll(async () => {
    await rm(testPath, {
      recursive: true,
    });
  });

  it("setup", async () => {
    // ======= check branches =======
    const branches = getAllBranches(repoPath);
    expect(new Set(branches)).toEqual(
      new Set(["mock", "feature-1", "feature-2"])
    );

    // ======= check project directory =======
    const projectFiles = await readdir(projectPath);
    expect(new Set(projectFiles)).toEqual(
      new Set([
        PROJECT_FILES.CODE_WORKSPACE,
        PROJECT_FILES.CONFIGURATION,
        mockRepoName,
      ])
    );

    // ======= check repodir directory ======
    const dirFiles = await readdir(path.dirname(repoPath));
    expect(new Set(dirFiles)).toEqual(new Set(["mock"]));
  });

  it("add a worktree based on a new branch", async () => {
    const mockBranch = randomUUID().split("-")[0];
    worktrees.push(mockBranch);
    const branchPath = normalizePath(
      path.resolve(projectPath, mockRepoName + path.sep + mockBranch)
    );

    await run(program, `add --repo ${mockRepoName} ${mockBranch}`, {
      cwd: projectPath,
    });

    // ======= check branches =======
    const branches = getAllBranches(repoPath);
    expect(new Set(branches)).toEqual(
      new Set([...worktrees, "mock", "feature-1", "feature-2"])
    );

    // ======= check repodir directory =======
    const dirFiles =  await readdir(path.dirname(repoPath));
    expect(new Set(dirFiles)).toEqual(new Set(["mock", ...worktrees]));

    // ======= check branch directory =======
    const branchFiles =  await readdir(branchPath);
    expect(new Set(branchFiles)).toEqual(new Set(["README.md", ".git"]));
  });

  it("add a worktree based on an existed branch", async () => {
    const existedBranch = "feature-1";
    worktrees.push(existedBranch);
    const branchPath = normalizePath(
      path.resolve(projectPath, mockRepoName + path.sep + existedBranch)
    );

    await run(program, `add --repo ${mockRepoName} ${existedBranch}`, {
      cwd: projectPath,
    });

    // ======= check branches =======
    const branches = getAllBranches(repoPath);
    expect(new Set(branches)).toEqual(
      new Set([...worktrees, "mock", "feature-1", "feature-2"])
    );

    // ======= check repodir directory =======
    const dirFiles =  await readdir(path.dirname(repoPath));
    expect(new Set(dirFiles)).toEqual(new Set(["mock", ...worktrees]));

    // ======= check branch directory =======
    const branchFiles =  await readdir(branchPath);
    expect(new Set(branchFiles)).toEqual(
      new Set(["README.md", "feature-1.md", ".git"])
    );
  });

  it("add a worktree based on a new branch which is from an existed branch", async () => {
    const mockBranch = randomUUID().split("-")[0];
    worktrees.push(mockBranch);

    const branchPath = normalizePath(
      path.resolve(projectPath, mockRepoName + path.sep + mockBranch)
    );
    await run(
      program,
      `add --base feature-2 --repo ${mockRepoName} ${mockBranch}`,
      {
        cwd: projectPath,
      }
    );

    // ======= check branches =======
    const branches = getAllBranches(repoPath);
    expect(new Set(branches)).toEqual(
      new Set([...worktrees, "mock", "feature-1", "feature-2"])
    );

    // ======= check repodir directory =======
    const dirFiles =  await readdir(path.dirname(repoPath));
    expect(new Set(dirFiles)).toEqual(new Set(["mock", ...worktrees]));

    // ======= check branch directory =======
    const branchFiles =  await readdir(branchPath);
    expect(new Set(branchFiles)).toEqual(
      new Set(["README.md", "feature-2.md", ".git"])
    );
  });
});
