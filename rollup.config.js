import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import shebang from "rollup-plugin-preserve-shebang";

export default {
  input: `src/index.js`,
  output: { file: "dist/main.js", format: "cjs" },
  external: [
    "child_process",
    "fs",
    "os",
    "crypto",
    "path",
    "util",
    "assert",
    "ws",
    "net",
    "tty",
  ],
  plugins: [
    resolve({
      preferBuiltins: false,
      browser: false,
      mainFields: ["main"],
    }),
    commonjs({
      include: [
        "node_modules/yargs/**/*",
        "node_modules/tmp/**/*",
        "node_modules/y18n/**/*",
        "node_modules/@holochain/conductor-api/**/*",
        "node_modules/@msgpack/msgpack/**/*",
        "node_modules/isomorphic-ws/**/*",
        "node_modules/get-port/**/*",
      ],
    }),
    shebang({
      shebang: "#!/usr/bin/env node",
    }),
  ],
};
