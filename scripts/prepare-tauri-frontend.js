"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "dist", "desktop");

const files = [
  "index.html",
  "styles.css",
  "data.js",
  "planner.js",
  "app.js",
  "VERSION"
];

const directories = [
  path.join("src", "core", "rules"),
  path.join("src", "app", "storage"),
  path.join("src", "app", "import-export"),
  path.join("src", "app", "charts")
];

removeDir(outDir);
fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  copyFile(file);
}

for (const directory of directories) {
  copyJsDirectory(directory);
}

console.log(`tauri-frontend: prepared ${path.relative(root, outDir)}`);

function copyFile(relativePath) {
  const source = path.join(root, relativePath);
  const target = path.join(outDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyJsDirectory(relativePath) {
  const sourceDir = path.join(root, relativePath);
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
    copyFile(path.join(relativePath, entry.name));
  }
}

function removeDir(directory) {
  if (fs.existsSync(directory)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
