import { describe, expect, it, beforeAll } from "@jest/globals";
import path from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { mockGitRepository, run } from "./utils";
import {
  checkIsPathCaseSensitive,
  getProjectFile,
  normalizePath,
} from "../lib/utils/file";
import { EPROJECT_FILES, EPROJECT_TYPE } from "../lib/utils/types";
import { getAllBranches, getGitConfiguration } from "../lib/utils/git";
import { readdirSync } from "node:fs";



// describe(`A "single-repo" project manages all git worktrees`, () => {
//   let program: string;
//   let testPath: string;
//   let mockGitRepoPath: string;
//   let initGitRepoProjectPath: string;
//   let cloneGitRepoProjectPath: string;
//   const mockBranch: string = randomUUID().split("-")[0];

//   beforeAll(async () => {
//     program = path.resolve("build/index.js");

//     // test directory must be outside a git repository
//     testPath = path.resolve(
//       path.dirname(process.cwd()),
//       ".test_" + randomUUID().split("-")[0]
//     );
//     await mkdir(testPath);

//     mockGitRepoPath = path.resolve(testPath, randomUUID().split("-")[0]);
//     await mockGitRepository(mockGitRepoPath);
//   });

//   afterAll(async () => {
//     await rm(testPath, { recursive: true });
//   });



//   it("add a worktree for initGitRepoPrject", async () => {
//     const repoPath = path.resolve(initGitRepoProjectPath, mockBranch);

//     try {
//       await run(program, `add ${mockBranch}`, {
//         cwd: initGitRepoProjectPath,
//       });

//       // ======= check branches =======
//       const branches = getAllBranches(repoPath);
//       expect(new Set(branches)).toEqual(new Set(["master", mockBranch]));

//       // ======= check files =======
//       const files = readdirSync(initGitRepoProjectPath);
//       expect(new Set(files)).toEqual(
//         new Set([
//           EPROJECT_FILES.CODE_WORKSPACE,
//           EPROJECT_FILES.CONFIGURATION,
//           "master",
//           mockBranch,
//         ])
//       );
//     } catch (error) {
//       throw error;
//     }
//   });

//   it("remove a worktree for initGitRepoPrject", async () => {
//     const repoPath = path.resolve(initGitRepoProjectPath, "master");
//     try {
//       await run(program, `rm -f ${mockBranch}`, {
//         cwd: initGitRepoProjectPath,
//       });
//       // ======= check branches =======
//       const branches = getAllBranches(repoPath);
//       expect(new Set(branches)).toEqual(new Set(["master"]));

//       // ======= check files =======
//       const files = readdirSync(initGitRepoProjectPath);
//       expect(new Set(files)).toEqual(
//         new Set([
//           EPROJECT_FILES.CODE_WORKSPACE,
//           EPROJECT_FILES.CONFIGURATION,
//           "master",
//         ])
//       );
//     } catch (error) {
//       throw error;
//     }
//   });

//   it("clone from a git-repository directory", async () => {
//     cloneGitRepoProjectPath = normalizePath(
//       path.resolve(testPath, randomUUID().split("-")[0])
//     );
//     const repoPath = path.resolve(cloneGitRepoProjectPath, "mock");
//     const projectConfigPath = normalizePath(
//       path.resolve(cloneGitRepoProjectPath, EPROJECT_FILES.CONFIGURATION)
//     );
//     try {
//       await mkdir(cloneGitRepoProjectPath);
//       await run(
//         program,
//         `clone ${mockGitRepoPath} ${cloneGitRepoProjectPath}`,
//         {
//           cwd: process.cwd(),
//         }
//       );

//       // ======= check git configuration =======
//       const gitConfig = getGitConfiguration(repoPath);
//       expect(gitConfig).toEqual({
//         path: projectConfigPath,
//         reponame: mockGitRepoPath.split("/").pop(),
//       });

//       // ======= check project configuration =======
//       const projectConfig = getProjectFile(
//         cloneGitRepoProjectPath,
//         EPROJECT_FILES.CONFIGURATION
//       );
//       expect(projectConfig).toEqual({
//         repos: [
//           {
//             name: gitConfig.reponame,
//             path: repoPath,
//           },
//         ],
//         type: EPROJECT_TYPE.SINGLE,
//       });

//       // ======= check branches =======
//       const branches = getAllBranches(repoPath);
//       expect(new Set(branches)).toEqual(
//         new Set([
//           "mock",
//           "remotes/origin/HEAD -> origin/mock",
//           "remotes/origin/mock",
//           "remotes/origin/feature-1",
//           "remotes/origin/feature-2",
//         ])
//       );

//       // ======= check files =======
//       const files = readdirSync(cloneGitRepoProjectPath);
//       expect(new Set(files)).toEqual(
//         new Set([
//           EPROJECT_FILES.CODE_WORKSPACE,
//           EPROJECT_FILES.CONFIGURATION,
//           "mock",
//         ])
//       );
//     } catch (error) {
//       throw error;
//     }
//   });
// });
