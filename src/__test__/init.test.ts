import { describe, expect, it,beforeAll,afterAll } from "@jest/globals";
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
describe("init", () => {
  const program: string = normalizePath(path.resolve("build/index.js"));
  const testPath: string = normalizePath(
    path.resolve(
      path.dirname(process.cwd()),
      ".test_" + randomUUID().split("-")[0]
    )
  );

  beforeAll(async () => {
    await mkdir(testPath);
  });
  afterAll(async () => {
    await rm(testPath, {
      recursive: true,
    });
  });

  it("init from a non-git-repository directory", async () => {
    const projectPath = normalizePath(
      path.resolve(testPath, randomUUID().split("-")[0])
    );

    const repoPath = path.resolve(projectPath, "master");
    const projectConfigPath = normalizePath(
      path.resolve(projectPath, EPROJECT_FILES.CONFIGURATION)
    );

    await mkdir(projectPath);
    await run(program, `init ${projectPath}`, {
      cwd: process.cwd(),
    });

    // ======= check git configuration =======
    const gitConfig = getGitConfiguration(repoPath);
    expect(gitConfig).toEqual({
      path: projectConfigPath,
      reponame: projectPath.split(path.sep).pop(),
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
    expect(branches).toEqual(["master"]);

    // ======= check files =======
    const files = readdirSync(projectPath);
    expect(new Set(files)).toEqual(
      new Set([
        EPROJECT_FILES.CODE_WORKSPACE,
        EPROJECT_FILES.CONFIGURATION,
        "master",
      ])
    );
  });

  it("init from a git-repository directory", async () => {
    const projectPath = normalizePath(
      path.resolve(testPath, randomUUID().split("-")[0])
    );
    await mockGitRepository(projectPath);

    const repoPath = path.resolve(projectPath, "mock");

    const projectConfigPath = normalizePath(
      path.resolve(projectPath, EPROJECT_FILES.CONFIGURATION)
    );

    await run(program, `init ${projectPath} `, {
      cwd: process.cwd(),
    });

    // ======= check git configuration =======
    const gitConfig = getGitConfiguration(repoPath);
    expect(gitConfig).toEqual({
      path: projectConfigPath,
      reponame: projectPath.split(path.sep).pop(),
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
      new Set(["mock", "feature-1", "feature-2"])
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
  });
});
