const path = require("node:path");
const fs = require("fs/promises");
const { execSync } = require("node:child_process");

const select = require("@inquirer/select").default;
rootDir = path.resolve(__dirname, "..");
buildDir = path.resolve(rootDir, "build");

async function run() {
  // remove
  try {
    await fs.rm(buildDir, {
      recursive: true,
    });
  } catch {}

  // build
  execSync("npm run build");

  // prepare package.json to publish
  const config = JSON.parse(
    await fs.readFile(path.resolve(rootDir, "package.json"), {
      encoding: "utf-8",
    })
  );
  config.bin.wt = "./index.js";
  config.scripts = undefined;
  await fs.writeFile(
    path.resolve(buildDir, "package.json"),
    JSON.stringify(config, null, 2)
  );

  // run test
  execSync("npm run test", {
    cwd: rootDir,
  });
  
  //publish
  execSync("npm publish --access public --dry-run", {
    cwd: buildDir,
  });

  const answer = await select({
    message: "Ready to publish?",
    choices: [
      {
        name: "Yeeeeap",
        value: true,
      },
      {
        name: "Nooooop",
        value: false,
      },
    ],
  });
  if (answer) {
    execSync("npm publish --access public ", {
      cwd: buildDir,
    });
  }
}

run().then((code) => {
  process.exit(code);
});
