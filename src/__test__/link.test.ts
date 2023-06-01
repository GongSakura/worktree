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
import { EPROJECT_FILES, EPROJECT_TYPE, IRepo } from "../lib/utils/types";
import { getGitConfiguration } from "../lib/utils/git";
import { readdirSync } from "node:fs";
global.isPathCaseSensitive = checkIsPathCaseSensitive();

describe("link", () => {
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
  const projectConfigPath = normalizePath(
    path.resolve(projectPath, EPROJECT_FILES.CONFIGURATION)
  );
  const repos: IRepo[] = [];
  const repoDirname: string[] = [];
  beforeAll(async () => {
    await mkdir(testPath);
    await run(program, `create ${projectPath}`);
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
      EPROJECT_FILES.CONFIGURATION
    );
    expect(projectConfig).toEqual({
      repos: [],
      type: EPROJECT_TYPE.MULTIPLE,
    });

    // ======= check files =======
    const files = readdirSync(projectPath);
    expect(new Set(files)).toEqual(
      new Set([EPROJECT_FILES.CODE_WORKSPACE, EPROJECT_FILES.CONFIGURATION])
    );
  });

  it("link to a local repository", async () => {
    const mockGitRepoPath: string = normalizePath(
      path.resolve(testPath, randomUUID().split("-")[0])
    );
    const mockRepoName = mockGitRepoPath.replace(/\.git/, "").split(path.sep).pop()!;

    await mockGitRepository(mockGitRepoPath);

    const repoPath = path.resolve(projectPath, `${mockRepoName}#mock`);

    await run(program, `link ${mockGitRepoPath} ${mockRepoName}`, {
      cwd: projectPath,
    });

    //  ======= check git configuration =======
    const gitConfig = getGitConfiguration(repoPath);
    expect(gitConfig).toEqual({
      path: projectConfigPath,
      reponame: mockRepoName,
    });

    repos.push({
      name: mockRepoName,
      path: repoPath,
    });
    repoDirname.push(`${mockRepoName}#mock`);

    // ======= check project configuration =======
    const projectConfig = getProjectFile(
      projectPath,
      EPROJECT_FILES.CONFIGURATION
    );
    expect(projectConfig).toMatchObject({
      repos,
      type: EPROJECT_TYPE.MULTIPLE,
    });

    // ======= check files =======
    const files = readdirSync(projectPath);
    expect(new Set(files)).toEqual(
      new Set([
        EPROJECT_FILES.CODE_WORKSPACE,
        EPROJECT_FILES.CONFIGURATION,
        ...repoDirname,
      ])
    );
  });

  it("link to a remote repository", async () => {
    const remoteGitRepoPath: string =
      "https://github.com/GongSakura/worktree.git";

    const remoteRepoName = remoteGitRepoPath
      .replace(/\.git/, "")
      .split(path.sep)
      .pop()!;

    const repoPath = path.resolve(projectPath, `${remoteRepoName}#master`);

    await run(program, `link ${remoteGitRepoPath} ${remoteRepoName}`, {
      cwd: projectPath,
    });

    //  ======= check git configuration =======
    const gitConfig = getGitConfiguration(repoPath);
    expect(gitConfig).toEqual({
      path: projectConfigPath,
      reponame: remoteRepoName,
    });
    repos.push({
      name: remoteRepoName,
      path: repoPath,
    });
    repoDirname.push(`${remoteRepoName}#master`);

    // ======= check project configuration =======
    const projectConfig = getProjectFile(
      projectPath,
      EPROJECT_FILES.CONFIGURATION
    );

    expect(projectConfig).toMatchObject({
      repos,
      type: EPROJECT_TYPE.MULTIPLE,
    });

    // ======= check files =======
    const files = readdirSync(projectPath);
    expect(new Set(files)).toEqual(
      new Set([
        EPROJECT_FILES.CODE_WORKSPACE,
        EPROJECT_FILES.CONFIGURATION,
        ...repoDirname,
      ])
    );
  });
});
