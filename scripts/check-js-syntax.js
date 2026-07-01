"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const generatedRoot = path.join(root, "dist", "generated");
const files = [
  "app.js",
  ...fs.readdirSync(path.join(generatedRoot, "src", "core", "data"))
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join("src", "core", "data", name)),
  ...fs.readdirSync(path.join(generatedRoot, "src", "app", "storage"))
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join("src", "app", "storage", name)),
  ...fs.readdirSync(path.join(generatedRoot, "src", "app", "import-export"))
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join("src", "app", "import-export", name)),
  ...fs.readdirSync(path.join(generatedRoot, "src", "app", "io"))
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join("src", "app", "io", name)),
  ...fs.readdirSync(path.join(generatedRoot, "src", "app", "charts"))
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join("src", "app", "charts", name)),
  ...fs.readdirSync(path.join(generatedRoot, "src", "app", "presenters"))
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join("src", "app", "presenters", name)),
  ...fs.readdirSync(path.join(generatedRoot, "src", "app", "render"))
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join("src", "app", "render", name)),
  ...fs.readdirSync(path.join(generatedRoot, "src", "app", "state"))
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join("src", "app", "state", name)),
  ...fs.readdirSync(path.join(generatedRoot, "src", "core", "rules"))
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join("src", "core", "rules", name))
];

let failed = false;

for (const file of files) {
  const sourcePath = file.startsWith("src") ? path.join(generatedRoot, file) : path.join(root, file);
  const result = spawnSync(process.execPath, ["--check", sourcePath], {
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
