import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { mkdir, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  checkIsPathCaseSensitive,
  getProjectFile,
  normalizePath,
} from "../lib/utils/file";
import { mockGitRepository, run } from "./utils";
import { getAllBranches } from "../lib/utils/git";
import { EPROJECT_FILES, EPROJECT_TYPE } from "../lib/utils/types";
import { exec } from "node:child_process";
global.isPathCaseSensitive = checkIsPathCaseSensitive();

describe("update from signle-repo project", () => {
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
  const mockRepoName = mockGitRepoPath
    .replace(/\.git$/, "")
    .split(path.sep)
    .pop();
  const projectPath: string = mockGitRepoPath;
  const repoPath: string = path.resolve(projectPath, "mock");

  beforeAll(async () => {
    await mkdir(testPath);
    await mockGitRepository(mockGitRepoPath);
    await run(program, `init ${mockGitRepoPath}`, {
      cwd: process.cwd(),
    });
    await run(program, `add feature-1`, {
      cwd: projectPath,
    });
    await run(program, `add feature-2`, {
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
    const projectFiles = await readdir(projectPath);
    expect(new Set(projectFiles)).toEqual(
      new Set([
        EPROJECT_FILES.CODE_WORKSPACE,
        EPROJECT_FILES.CONFIGURATION,
        "feature-1",
        "feature-2",
        "mock",
      ])
    );
  });

  it("update from changed direname", async () => {
    const paths = [
      [
        path.resolve(projectPath, "mock"),
        path.resolve(projectPath, randomUUID().split("-")[0]),
      ],
      [
        path.resolve(projectPath, "feature-1"),
        path.resolve(projectPath, randomUUID().split("-")[0]),
      ],
      [
        path.resolve(projectPath, "feature-2"),
        path.resolve(projectPath, randomUUID().split("-")[0]),
      ],
    ];
    for (const p of paths) {
      await rename(p[0], p[1]);
    }

    // ======= check project directory =======
    const projectFiles = await readdir(projectPath);
    expect(new Set(projectFiles)).toEqual(
      new Set([
        EPROJECT_FILES.CODE_WORKSPACE,
        EPROJECT_FILES.CONFIGURATION,
        ...paths.map((e) => e[1].split(path.sep).pop()),
      ])
    );

    await run(program, `update`, {
      cwd: projectPath,
    });

    // ======= check project directory =======
    expect(new Set(await readdir(projectPath))).toEqual(
      new Set([
        EPROJECT_FILES.CODE_WORKSPACE,
        EPROJECT_FILES.CONFIGURATION,
        ...paths.map((e) => e[0].split(path.sep).pop()),
      ])
    );
  });

  it("update from changed branches", async () => {
    const paths = [
      [path.resolve(projectPath, "mock"), randomUUID().split("-")[0]],
      [path.resolve(projectPath, "feature-1"), randomUUID().split("-")[0]],
      [path.resolve(projectPath, "feature-2"), randomUUID().split("-")[0]],
    ];
    for (const p of paths) {
      await exec(`git checkout -b ${p[1]}`, {
        cwd: p[0],
      });
    }
    await run(program, `update`, {
      cwd: projectPath,
    });

    // ======= check project directory =======
    expect(new Set(await readdir(projectPath))).toEqual(
      new Set([
        EPROJECT_FILES.CODE_WORKSPACE,
        EPROJECT_FILES.CONFIGURATION,
        ...paths.map((e) => e[1]),
      ])
    );

    // ======= check project configuration =======
    const projectConfig = getProjectFile(
      projectPath,
      EPROJECT_FILES.CONFIGURATION
    );
    expect(projectConfig.type).toBe(EPROJECT_TYPE.SINGLE);
    expect(projectConfig.repos).toEqual([
      {
        name: mockRepoName,
        path: normalizePath(path.resolve(projectPath, paths[0][1])),
      },
    ]);
  });
});

describe.only("update from multi-repos project", () => {
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

  const remoteGitRepoPath: string =
    "https://github.com/GongSakura/worktree.git";
  const remoteRepoName = remoteGitRepoPath
    .replace(/\.git/, "")
    .split("/")
    .pop()!;

  const repoInfo: any[] = [
    {
      name: mockRepoName,
      dirname: mockRepoName,
      path: path.resolve(projectPath, mockRepoName, "mock"),
      branches: ["mock", "feature-1", "feature-2"],
    },
    {
      name: remoteRepoName,
      dirname: remoteRepoName,
      path: path.resolve(projectPath, remoteRepoName, "master"),
      branches: ["master", "remotes/origin/dev", "remotes/origin/master"],
    },
  ];

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
    // ======= check branches =======
    repoInfo.forEach((repo) => {
      const branches = getAllBranches(repo.path);
      expect(new Set(branches)).toEqual(new Set(repo.branches));
    });

    // ======= check project directory =======
    const projectFiles = await readdir(projectPath);
    expect(new Set(projectFiles)).toEqual(
      new Set([
        EPROJECT_FILES.CODE_WORKSPACE,
        EPROJECT_FILES.CONFIGURATION,
        remoteRepoName,
        mockRepoName,
     
      ])
    );

    // ======= check project configuration =======
    const projectConfig = getProjectFile(
      projectPath,
      EPROJECT_FILES.CONFIGURATION
    );

    expect(projectConfig.type).toBe(EPROJECT_TYPE.MULTIPLE);
    expect(projectConfig.repos).toEqual(
      repoInfo.map((repo) => {
        return { name: repo.name, path: repo.path };
      })
    );
  });

  it("update from changed dirname", async () => {
    const paths = [
      [
        path.resolve(projectPath, mockRepoName + path.sep + "mock"),
        path.resolve(projectPath, randomUUID().split("-")[0]),
      ],
      [
        path.resolve(projectPath, mockRepoName + path.sep + "feature-1"),
        path.resolve(projectPath, randomUUID().split("-")[0]),
      ],
      [
        path.resolve(projectPath, remoteRepoName + path.sep + "master"),
        path.resolve(projectPath, randomUUID().split("-")[0]),
      ],
    ];

    for (const p of paths) {
      await rename(p[0], p[1]);
    }

    // ======= check project directory =======
    const projectFiles = await readdir(projectPath);
    expect(new Set(projectFiles)).toEqual(
      new Set([
        EPROJECT_FILES.CODE_WORKSPACE,
        EPROJECT_FILES.CONFIGURATION,
        remoteRepoName,
        mockRepoName,
        ...paths.map((e) => e[1].split(path.sep).pop()),
      ])
    );

    await run(program, `update`, {
      cwd: projectPath,
    });

    // ======= check project directory =======
    expect(new Set(await readdir(projectPath))).toEqual(
      new Set([
        EPROJECT_FILES.CODE_WORKSPACE,
        EPROJECT_FILES.CONFIGURATION,
        remoteRepoName,
        mockRepoName,
      ])
    );
  });

  it("update from changed branches", async () => {
    const paths = [
      [
        path.resolve(projectPath, mockRepoName + path.sep + "mock"),
        randomUUID().split("-")[0],
      ],
      [
        path.resolve(projectPath, mockRepoName + path.sep + "feature-1"),
        randomUUID().split("-")[0],
      ],
      [
        path.resolve(projectPath, remoteRepoName + path.sep + "master"),
        randomUUID().split("-")[0],
      ],
    ];
    for (const p of paths) {
      await exec(`git checkout -b ${p[1]}`, {
        cwd: p[0],
      });
    }
    await run(program, `update`, {
      cwd: projectPath,
    });

    // ======= check repodir directory ======
    expect(
      new Set(await readdir(path.resolve(projectPath, mockRepoName)))
    ).toEqual(new Set([paths[0][1], paths[1][1]]));
    expect(
      new Set(await readdir(path.resolve(projectPath, remoteRepoName)))
    ).toEqual(new Set([paths[2][1]]));

    // ======= check project configuration =======
    const projectConfig = getProjectFile(
      projectPath,
      EPROJECT_FILES.CONFIGURATION
    );

    expect(projectConfig.type).toBe(EPROJECT_TYPE.MULTIPLE);
    expect(projectConfig.repos).toEqual([
      {
        name: mockRepoName,
        path: path.resolve(projectPath, mockRepoName + path.sep + paths[0][1]),
      },
      {
        name: remoteRepoName,
        path: path.resolve(
          projectPath,
          remoteRepoName + path.sep + paths[2][1]
        ),
      },
    ]);
  });
});
