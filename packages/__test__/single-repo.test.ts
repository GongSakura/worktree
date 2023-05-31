import { describe, expect, it, beforeAll } from "@jest/globals";
import path from "node:path";
import { rmdir, rm, mkdir } from "node:fs/promises";
import { Command } from "commander";
import { randomUUID } from "node:crypto";

import { CommandCreator, ActionCreator } from "../lib/commands";
import { getAllBranches, getGitConfiguration } from "../lib/utils/git";
import { EPROJECT_FILES, EPROJECT_TYPE } from "../lib/utils/types";
import {
  checkIsPathCaseSensitive,
  getProjectFile,
  normalizePath,
} from "../lib/utils/file";
import { done } from "../lib/utils/action";

describe(`A "single-repo" project manages all git worktrees`, () => {
  let program: Command;
  let testDirPath: string;
  let isPathCaseSensitive: boolean;

  beforeAll(async () => {
    program = new Command("wt");

    // test directory must be outside a git repository
    testDirPath = path.resolve(
      path.dirname(process.cwd()),
      ".test-" + randomUUID().split("-")[0]
    );

    isPathCaseSensitive = checkIsPathCaseSensitive();

    await mkdir(testDirPath);
  });

  afterAll(async () => {
    await rm(testDirPath, { recursive: true });
  });

  it("init from a non-git-repository directory", async () => {
    const projectPath = normalizePath(
      path.resolve(testDirPath, randomUUID().split("-")[0])
    );

    program.addCommand(CommandCreator.init(ActionCreator.init(done)));
    await mkdir(projectPath);
    await program.parseAsync(["", "", "init", projectPath]);
    const repoPath = path.resolve(projectPath, "master");
    const projectConfigPath = normalizePath(
      path.resolve(projectPath, EPROJECT_FILES.CONFIGURATION)
    );

    const gitConfig = getGitConfiguration(repoPath);

    expect(gitConfig).toEqual({
      path: projectConfigPath,
      reponame: projectPath.split("/").pop(),
    });

    const branches = getAllBranches(repoPath);
    expect(branches).toEqual(["master"]);

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
  });
});
