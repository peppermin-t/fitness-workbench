"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const generatedRoot = path.join(root, "dist", "generated");
const files = collectJsFiles(path.join(generatedRoot, "src"))
  .map((file) => path.relative(generatedRoot, file));

let failed = false;

for (const file of files) {
  const sourcePath = path.join(generatedRoot, file);
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

function collectJsFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files.sort();
}
