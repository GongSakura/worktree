import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
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
describe("clone", () => {
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
  const remoteGitRepoPath: string =
    "https://github.com/GongSakura/worktree.git";

  beforeAll(async () => {
    await mkdir(testPath);
    await mockGitRepository(mockGitRepoPath);
  });

  afterAll(async () => {
    await rm(testPath, {
      recursive: true,
    });
  });

  it("clone from a local repository", async () => {
    try {
      const projectPath = normalizePath(
        path.resolve(testPath, randomUUID().split("-")[0])
      );

      const repoPath = path.resolve(projectPath, "mock");
      const projectConfigPath = normalizePath(
        path.resolve(projectPath, EPROJECT_FILES.CONFIGURATION)
      );

      await mkdir(projectPath);
      await run(program, `clone ${mockGitRepoPath}`, {
        cwd: projectPath,
      });

      //  ======= check git configuration =======
      const gitConfig = getGitConfiguration(repoPath);
      expect(gitConfig).toEqual({
        path: projectConfigPath,
        reponame: mockGitRepoPath.split(path.sep).pop(),
      });

      // ======= check project configuration =======
      const projectConfig = getProjectFile(
        projectPath,
        EPROJECT_FILES.CONFIGURATION
      );
      expect(projectConfig).toEqual({
        repos: [
          {
            name: gitConfig.reponame,
            path: repoPath,
          },
        ],
        type: EPROJECT_TYPE.SINGLE,
      });

      // ======= check branches =======
      const branches = getAllBranches(repoPath);
      expect(new Set(branches)).toEqual(
        new Set([
          "mock",
          "remotes/origin/mock",
          "remotes/origin/feature-1",
          "remotes/origin/feature-2",
        ])
      );

      // ======= check files =======
      const files = readdirSync(projectPath);
      expect(new Set(files)).toEqual(
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

  it("clone from a remote repository", async () => {
    try {
      const projectPath = normalizePath(
        path.resolve(testPath, randomUUID().split("-")[0])
      );
      const projectConfigPath = normalizePath(
        path.resolve(projectPath, EPROJECT_FILES.CONFIGURATION)
      );

      // The main worktree path
      const repoPath = normalizePath(path.resolve(projectPath, "master"));

      await run(program, `clone ${remoteGitRepoPath} ${projectPath} `, {
        cwd: process.cwd(),
      });

      // ======= check git configuration =======
      const gitConfig = getGitConfiguration(repoPath);
      expect(gitConfig).toEqual({
        path: projectConfigPath,
        reponame: remoteGitRepoPath
          .replace(/\.git$/, "")
          .split(path.sep)
          .pop(),
      });

      // ======= check project configuration =======
      const projectConfig = getProjectFile(
        projectPath,
        EPROJECT_FILES.CONFIGURATION
      );
      expect(projectConfig).toEqual({
        repos: [
          {
            name: gitConfig.reponame,
            path: repoPath,
          },
        ],
        type: EPROJECT_TYPE.SINGLE,
      });

      // ======= check branches =======
      const branches = getAllBranches(repoPath);
      expect(new Set(branches)).toEqual(
        new Set([
          "master",
          "remotes/origin/master",
          "remotes/origin/dev",
        ])
      );

      // ======= check files =======
      const files = readdirSync(projectPath);
      expect(new Set(files)).toEqual(
        new Set([
          EPROJECT_FILES.CODE_WORKSPACE,
          EPROJECT_FILES.CONFIGURATION,
          "master",
        ])
      );
    } catch (error) {
      throw error;
    }
  });
});
