const typescript = require("@rollup/plugin-typescript");
const nodeResolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const {chmodSync } = require("fs");

module.exports = {
  input: "src/index.ts",
  output: {
    dir: "bin",
    format: "cjs",
  },
  plugins: [
    commonjs(),
    nodeResolve({
      browser: false,
    }),
    typescript({
      compilerOptions: {
        declaration: true,
        declarationDir: "bin",
      },
    }),
    {
      name: "shebang",
      generateBundle(_, bundle) {
        bundle["index.js"].code =
          "#!/usr/bin/env node\n" + bundle["index.js"].code;
      },
      writeBundle() {
        chmodSync("index.js", 0o777);
      },
    },
  ],
  watch: true,
};
