import { describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { mockGitRepository, run } from "./utils";
import {
  checkIsPathCaseSensitive,
  getProjectFile,
  normalizePath,
} from "../lib/utils/file";
import { EPROJECT_FILES, EPROJECT_TYPE } from "../lib/utils/types";
import { getAllBranches, getGitConfiguration } from "../lib/utils/git";
import { readdirSync } from "node:fs";

global.isPathCaseSensitive = checkIsPathCaseSensitive();

describe("add", () => {
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
        EPROJECT_FILES.CODE_WORKSPACE,
        EPROJECT_FILES.CONFIGURATION,
        "feature-2",
        "feature-1",
        "mock",
      ])
    );
  });

  it("remove a worktree", async () => {
    try {
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
          EPROJECT_FILES.CODE_WORKSPACE,
          EPROJECT_FILES.CONFIGURATION,
          "feature-2",
          "mock",
        ])
      );
    } catch (error) {
      throw error;
    }
  });

  it("remove a worktree and its branch", async () => {
    try {
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
          EPROJECT_FILES.CODE_WORKSPACE,
          EPROJECT_FILES.CONFIGURATION,
          "mock",
        ])
      );
    } catch (error) {
      throw error;
    }
  });
});
