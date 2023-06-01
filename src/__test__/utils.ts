import {
  exec,
  execSync,
  ExecSyncOptions,
  ExecSyncOptionsWithBufferEncoding,
} from "node:child_process";

export async function execSyncSequences(
  commands: string[],
  option?: ExecSyncOptions
) {
  try {
    for (const command of commands) {
      execSync(command, option);
    }
  } catch (error) {
    throw error;
  }
}

export async function mockGitRepository(cwdPath: string) {
  return new Promise((resolve, reject) => {
    // initial branch name: "mock"
    exec(
      `git init -b mock ${cwdPath}`,
      (error: any, stdout: any, stderr: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout || stderr);
        }
      }
    );
  })
    .then(() => {
      try {
        execSyncSequences(
          ["echo Hello > README.md", "git add .", 'git commit -m"1st mock"'],
          {
            cwd: cwdPath,
            stdio: "pipe",
          }
        );
      } catch (error) {
        return Promise.reject(error);
      }
    })
    .then(() => {
      try {
        execSyncSequences(
          [
            "git checkout -b feature-1",
            "echo feature-1 > feature-1.md",
            "git add .",
            'git commit -m"1st feature-1"',
            "git checkout mock",
          ],
          {
            cwd: cwdPath,
            stdio: "pipe",
          }
        );
      } catch (error) {
        return Promise.reject(error);
      }
    })
    .then(() => {
      try {
        execSyncSequences(
          [
            "git checkout -b feature-2",
            "echo feature-2 > feature-2.md",
            "git add .",
            'git commit -m"1st feature-2"',
            "git checkout mock",
          ],
          {
            cwd: cwdPath,
            stdio: "pipe",
          }
        );
      } catch (error) {
        return Promise.reject(error);
      }
    });
}

export async function run(
  executablePath: string,
  command: string,
  options: ExecSyncOptionsWithBufferEncoding = {}
) {
  return new Promise((resolve, reject) => {
    try {
      const stdout = execSync(`node ${executablePath} ${command}`, options);
      resolve(stdout);
    } catch (error) {
      reject(error);
    }
  });
}
