const typescript = require("@rollup/plugin-typescript");
const nodeResolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const json = require("@rollup/plugin-json");
const { chmodSync } = require("fs");

module.exports = {
  input: "src/index.ts",
  output: {
    dir: "build",
    format: "cjs",
  },
  plugins: [
    json(),
    commonjs(),
    nodeResolve({
      preferBuiltins: true,
      exportConditions: ["node"],
    }),
    typescript(),
    {
      name: "shebang",
      generateBundle(_, bundle) {
        bundle["index.js"].code =
          "#!/usr/bin/env node\n" + bundle["index.js"].code;
      },
      writeBundle() {
        chmodSync("./build/index.js", 0o777);
      },
    },
  ],
  watch: true,
};
