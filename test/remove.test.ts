import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { mockGitRepository, run } from "./utils";
import { checkIsPathCaseSensitive, normalizePath } from "../src/utils/file";
import { PROJECT_FILES } from "../src/utils/types";
import { getAllBranches } from "../src/utils/git";
import { readdirSync } from "node:fs";

global.isPathCaseSensitive = checkIsPathCaseSensitive();

describe("remove from single-repo project", () => {
  const program: string = normalizePath(path.resolve("dist/index.js"));
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

  beforeAll(async () => {
    await mkdir(testPath);
    await mockGitRepository(mockGitRepoPath);
    await run(program, `init ${mockGitRepoPath}`);
    await run(program, `add feature-1`, { cwd: projectPath });
    await run(program, `add feature-2`, { cwd: projectPath });
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
    const projectFiles = readdirSync(projectPath);
    expect(new Set(projectFiles)).toEqual(
      new Set([
        PROJECT_FILES.CODE_WORKSPACE,
        PROJECT_FILES.CONFIGURATION,
        "feature-2",
        "feature-1",
        "mock",
      ])
    );
  });

  it("remove a worktree", async () => {
    await run(program, `remove feature-1`, {
      cwd: projectPath,
    });

    // ======= check branches =======
    const branches = getAllBranches(repoPath);
    expect(new Set(branches)).toEqual(
      new Set(["mock", "feature-1", "feature-2"])
    );

    // ======= check project directory =======
    const projectFiles = readdirSync(projectPath);
    expect(new Set(projectFiles)).toEqual(
      new Set([
        PROJECT_FILES.CODE_WORKSPACE,
        PROJECT_FILES.CONFIGURATION,
        "feature-2",
        "mock",
      ])
    );
  });

  it("remove a worktree and its branch", async () => {
    await run(program, `remove -f feature-2`, {
      cwd: projectPath,
    });

    // ======= check branches =======
    const branches = getAllBranches(repoPath);
    expect(new Set(branches)).toEqual(new Set(["mock", "feature-1"]));

    // ======= check project directory =======
    const projectFiles = readdirSync(projectPath);
    expect(new Set(projectFiles)).toEqual(
      new Set([
        PROJECT_FILES.CODE_WORKSPACE,
        PROJECT_FILES.CONFIGURATION,
        "mock",
      ])
    );
  });
});

describe("remove from multi-repos project", () => {
  const program: string = normalizePath(path.resolve("dist/index.js"));
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

  beforeAll(async () => {
    await mkdir(testPath);
    await mockGitRepository(mockGitRepoPath);
    await run(program, `create ${projectPath}`);
    await run(program, `link ${mockGitRepoPath} ${mockRepoName}`, {
      cwd: projectPath,
    });
    await run(program, `add --repo ${mockRepoName} feature-1`, {
      cwd: projectPath,
    });
    await run(program, `add --repo ${mockRepoName} feature-2`, {
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
    const projectFiles = readdirSync(projectPath);
    expect(new Set(projectFiles)).toEqual(
      new Set([
        PROJECT_FILES.CODE_WORKSPACE,
        PROJECT_FILES.CONFIGURATION,
        mockRepoName,
      ])
    );

    // ======= check repodir directory =======
    const dirFiles = readdirSync(path.dirname(repoPath));
    expect(new Set(dirFiles)).toEqual(
      new Set(["feature-2", "feature-1", "mock"])
    );
  });

  it("remove a worktree, except the branch", async () => {
    await run(program, `remove --repo ${mockRepoName} feature-1`, {
      cwd: projectPath,
    });

    // ======= check branches =======
    const branches = getAllBranches(repoPath);
    expect(new Set(branches)).toEqual(
      new Set(["mock", "feature-1", "feature-2"])
    );

    // ======= check repodir directory =======
    
    const dirFiles = readdirSync(path.dirname(repoPath));
    expect(new Set(dirFiles)).toEqual(new Set(["feature-2", "mock"]));
  });

  it("remove a worktree and its branch", async () => {
    await run(program, `remove -f --repo ${mockRepoName} feature-2`, {
      cwd: projectPath,
    });

    // ======= check branches =======
    const branches = getAllBranches(repoPath);
    expect(new Set(branches)).toEqual(new Set(["mock", "feature-1"]));

    // ======= check repodir directory =======
    const dirFiles = readdirSync(path.dirname(repoPath));
    expect(new Set(dirFiles)).toEqual(new Set(["mock"]));
  });
});
