import { describe, expect, it, afterAll, beforeAll } from "@jest/globals";
import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { mockGitRepository, run } from "./utils";
import {
  checkIsPathCaseSensitive,
  getProjectFile,
  normalizePath,
} from "../lib/utils/file";
import { PROJECT_FILES, PROJECT_TYPE } from "../lib/utils/types";
import { readdirSync } from "node:fs";
global.isPathCaseSensitive = checkIsPathCaseSensitive();

describe("unlink", () => {
  const program: string = normalizePath(path.resolve("build/index.js"));
  const testPath: string = normalizePath(
    path.resolve(
      path.dirname(process.cwd()),
      ".test_" + randomUUID().split("-")[0]
    )
  );

  const projectPath = normalizePath(
    path.resolve(testPath, randomUUID().split("-")[0])
  );

  const mockGitRepoPath: string = normalizePath(
    path.resolve(testPath, randomUUID().split("-")[0])
  );
  const mockRepoName = mockGitRepoPath
    .replace(/\.git/, "")
    .split(path.sep)
    .pop()!;
  const mockRepoPath = path.resolve(projectPath, mockRepoName, "mock");

  const remoteGitRepoPath: string =
    "https://github.com/GongSakura/worktree.git";
  const remoteRepoName = remoteGitRepoPath
    .replace(/\.git/, "")
    .split("/")
    .pop()!;
  const remoteRepoPath = path.resolve(projectPath, remoteRepoName, "master");
  const repoDirname: string[] = [remoteRepoName, mockRepoName];

  beforeAll(async () => {
    await mkdir(testPath);
    await run(program, `create ${projectPath}`);
    await mockGitRepository(mockGitRepoPath);
    await run(program, `link ${mockGitRepoPath} ${mockRepoName}`, {
      cwd: projectPath,
    });
    await run(program, `link ${remoteGitRepoPath} ${remoteRepoName}`, {
      cwd: projectPath,
    });
  });

  afterAll(async () => {
    await rm(testPath, {
      recursive: true,
    });
  });

  it("setup", async () => {
    // ======= check project configuration =======
    const projectConfig = getProjectFile(
      projectPath,
      PROJECT_FILES.CONFIGURATION
    );
    expect(projectConfig).toEqual({
      repos: [
        {
          name: mockRepoName,
          path: mockRepoPath,
        },
        {
          name: remoteRepoName,
          path: remoteRepoPath,
        },
      ],
      type: PROJECT_TYPE.MULTIPLE,
    });

    // ======= check files =======
    const files = readdirSync(projectPath);
    expect(new Set(files)).toEqual(
      new Set([
        ...repoDirname,
        PROJECT_FILES.CODE_WORKSPACE,
        PROJECT_FILES.CONFIGURATION,
      ])
    );
  });

  it("unlink a mock repository", async () => {
    await run(program, `unlink ${mockRepoName}`, {
      cwd: projectPath,
    });
    repoDirname.pop();

    // ======= check project configuration =======
    const projectConfig = getProjectFile(
      projectPath,
      PROJECT_FILES.CONFIGURATION
    );
    expect(projectConfig).toEqual({
      repos: [
        {
          name: remoteRepoName,
          path: remoteRepoPath,
        },
      ],
      type: PROJECT_TYPE.MULTIPLE,
    });

    // ======= check files =======
    const files = readdirSync(projectPath);
    expect(new Set(files)).toEqual(
      new Set([
        ...repoDirname,
        PROJECT_FILES.CODE_WORKSPACE,
        PROJECT_FILES.CONFIGURATION,
      ])
    );
  });

  
  it("unlink a remote repository", async () => {
    await run(program, `unlink ${remoteRepoName}`, {
      cwd: projectPath,
    });
    repoDirname.pop();

    // ======= check project configuration =======
    const projectConfig = getProjectFile(
      projectPath,
      PROJECT_FILES.CONFIGURATION
    );
    expect(projectConfig).toEqual({
      repos: [],
      type: PROJECT_TYPE.MULTIPLE,
    });

    // ======= check files =======
    const files = readdirSync(projectPath);
    expect(new Set(files)).toEqual(
      new Set([
        ...repoDirname,
        PROJECT_FILES.CODE_WORKSPACE,
        PROJECT_FILES.CONFIGURATION,
      ])
    );
  });
});
