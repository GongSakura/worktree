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

  it("create an empty project", async () => {
    try {
      const projectPath = normalizePath(
        path.resolve(testPath, randomUUID().split("-")[0])
      );

      const projectConfigPath = normalizePath(
        path.resolve(projectPath, EPROJECT_FILES.CONFIGURATION)
      );

      await mkdir(projectPath);
      await run(program, `create ${projectPath}`, {
        cwd: process.cwd(),
      });

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
    } catch (error) {
      throw error;
    }
  });
});