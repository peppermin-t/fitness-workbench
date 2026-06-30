"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const files = [
  "app.js",
  "planner.js",
  "data.js",
  ...fs.readdirSync(path.join(root, "src", "app", "storage"))
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join("src", "app", "storage", name)),
  ...fs.readdirSync(path.join(root, "src", "app", "import-export"))
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join("src", "app", "import-export", name)),
  ...fs.readdirSync(path.join(root, "src", "app", "charts"))
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join("src", "app", "charts", name)),
  ...fs.readdirSync(path.join(root, "src", "core", "rules"))
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join("src", "core", "rules", name))
];

let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", path.join(root, file)], {
    encoding: "utf8"
  });

  if (result.status !== 0) {
    failed = true;
    console.error(`JS syntax check failed: ${file}`);
    if (result.stdout) console.error(result.stdout.trim());
    if (result.stderr) console.error(result.stderr.trim());
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log(`js-syntax: ${files.length} files passed`);
}
