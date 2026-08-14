const { spawn } = require("child_process");
const nextBin = require("path").join(__dirname, "node_modules/.bin/next");
const port = process.env.PORT || "3001";
const child = spawn(nextBin, ["dev", "--turbopack", "-H", "0.0.0.0", "-p", port], {
  cwd: __dirname,
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => process.exit(code === null ? 1 : code));
