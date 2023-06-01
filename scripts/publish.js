const path = require("node:path");
const fs = require("fs/promises");
const { execSync } = require("node:child_process");

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
  await fs.writeFile(
    path.resolve(buildDir, "package.json"),
    JSON.stringify(config, null, 2)
  );
}

run().then((code) => {
  process.exit(code);
});
