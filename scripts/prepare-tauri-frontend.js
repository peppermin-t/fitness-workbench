"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "dist", "desktop");
const generatedDir = path.join(root, "dist", "generated");

const files = [
  "VERSION"
];

removeDir(outDir);
fs.mkdirSync(outDir, { recursive: true });

copyFileAs(path.join("src", "app", "index.html"), "index.html");
copyFileAs(path.join("src", "app", "styles.css"), "styles.css");

for (const file of files) {
  copyFile(file);
}

copyGeneratedJsTree(path.join(generatedDir, "src"), "src");

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

function copyGeneratedJsTree(sourceDir, targetRelativeDir) {
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const source = path.join(sourceDir, entry.name);
    const targetRelative = path.join(targetRelativeDir, entry.name);
    if (entry.isDirectory()) {
      copyGeneratedJsTree(source, targetRelative);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      copyFileAs(path.relative(root, source), targetRelative);
    }
  }
}

function removeDir(directory) {
  if (fs.existsSync(directory)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
