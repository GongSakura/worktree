import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { mockGitRepository, run } from "./utils";
import {
  checkIsPathCaseSensitive,
  getProjectFile,
  normalizePath,
} from "../src/utils/file";
import { PROJECT_FILES, PROJECT_TYPE } from "../src/utils/types";
import { readdirSync } from "node:fs";
global.isPathCaseSensitive = checkIsPathCaseSensitive();

describe("create", () => {
  const program: string = normalizePath(path.resolve("dist/index.js"));
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

  it("create an empty project for multi-repos", async () => {
    const projectPath = normalizePath(
      path.resolve(testPath, randomUUID().split("-")[0])
    );

    await mkdir(projectPath);

    await run(program, `create ${projectPath}`, {
      cwd: process.cwd(),
    });

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
    expect(new Set(files)).toEqual(new Set([PROJECT_FILES.CONFIGURATION]));
  });

  it("create an empty project for single-repo", async () => {
    const projectPath = normalizePath(
      path.resolve(testPath, randomUUID().split("-")[0])
    );

    await mkdir(projectPath);
    await run(program, `create -s ${projectPath}`, {
      cwd: process.cwd(),
    });

    // ======= check project configuration =======
    const projectConfig = getProjectFile(
      projectPath,
      PROJECT_FILES.CONFIGURATION
    );
    expect(projectConfig).toEqual({
      repos: [],
      type: PROJECT_TYPE.SINGLE,
    });

    // ======= check files =======
    const files = readdirSync(projectPath);
    expect(new Set(files)).toEqual(new Set([PROJECT_FILES.CONFIGURATION]));
  });
});