"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "dist", "desktop");
const generatedDir = path.join(root, "dist", "generated");

const files = [
  "styles.css",
  "app.js",
  "VERSION"
];

const directories = [
  path.join("src", "core", "data"),
  path.join("src", "core", "rules"),
  path.join("src", "app", "storage"),
  path.join("src", "app", "import-export"),
  path.join("src", "app", "io"),
  path.join("src", "app", "charts"),
  path.join("src", "app", "presenters"),
  path.join("src", "app", "render"),
  path.join("src", "app", "state")
];

removeDir(outDir);
fs.mkdirSync(outDir, { recursive: true });

copyFileAs(path.join("src", "app", "index.html"), "index.html");

for (const file of files) {
  copyFile(file);
}

for (const directory of directories) {
  copyGeneratedJsDirectory(directory);
}

console.log(`tauri-frontend: prepared ${path.relative(root, outDir)}`);

function copyFile(relativePath) {
  copyFileAs(relativePath, relativePath);
}

function copyFileAs(sourceRelativePath, targetRelativePath) {
  const source = path.join(root, sourceRelativePath);
  const target = path.join(outDir, targetRelativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyGeneratedJsDirectory(relativePath) {
  const sourceDir = path.join(generatedDir, relativePath);
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
    copyFileAs(path.join("dist", "generated", relativePath, entry.name), path.join(relativePath, entry.name));
  }
}

function removeDir(directory) {
  if (fs.existsSync(directory)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
