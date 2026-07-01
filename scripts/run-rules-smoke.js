"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const generatedRoot = path.join(root, "dist", "generated");
const summaryNodes = {
  "#results": { innerHTML: "" },
  "#total": { textContent: "0" },
  "#passed": { textContent: "0" },
  "#failed": { textContent: "0" }
};

const sandbox = {
  console: {
    log() {},
    table() {},
    warn: console.warn,
    error: console.error
  },
  window: {},
  document: {
    querySelector(selector) {
      return summaryNodes[selector] || null;
    }
  },
  Date,
  Number,
  Math,
  RegExp,
  String,
  Array,
  JSON,
  Error,
  Boolean,
  Object,
  setTimeout,
  clearTimeout
};

sandbox.window = sandbox;

const context = vm.createContext(sandbox);
const runtimeScripts = [
  ["generated", "src/core/data/fitness-data.js"],
  ["generated", "src/core/rules/goal-parser.js"],
  ["generated", "src/core/rules/metric-analyzer.js"],
  ["generated", "src/core/rules/training-stats.js"],
  ["generated", "src/core/rules/advice-engine.js"],
  ["generated", "src/core/rules/plan-generator.js"],
  ["generated", "src/core/rules/exercise-feedback-analyzer.js"],
  ["generated", "src/core/rules/nutrition-parser.js"],
  ["generated", "src/core/rules/integrated-signals.js"],
  ["generated", "src/core/rules/weekly-review.js"],
  ["generated", "src/core/rules/facade.js"],
  ["generated", "src/app/storage/state-normalizer.js"],
  ["generated", "src/app/storage/desktop-sqlite.js"]
];

for (const file of runtimeScripts) {
  runFile(file);
}

const smokeHtmlPath = path.join(root, "tests", "rules-smoke.html");
const smokeHtml = fs.readFileSync(smokeHtmlPath, "utf8");
const inlineScripts = [...smokeHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);

if (!inlineScripts.length) {
  throw new Error("No inline test script found in tests/rules-smoke.html.");
}

vm.runInContext(inlineScripts[inlineScripts.length - 1], context, {
  filename: "tests/rules-smoke.html:inline"
});

const result = {
  total: Number(summaryNodes["#total"].textContent),
  passed: Number(summaryNodes["#passed"].textContent),
  failed: Number(summaryNodes["#failed"].textContent)
};

console.log(`rules-smoke: ${result.passed}/${result.total} passed, ${result.failed} failed`);

if (result.total !== 12 || result.passed !== 12 || result.failed !== 0) {
  process.exitCode = 1;
}

function runFile(file) {
  const isGenerated = Array.isArray(file);
  const relativePath = isGenerated ? file[1] : file;
  const fullPath = isGenerated ? path.join(generatedRoot, relativePath) : path.join(root, relativePath);
  vm.runInContext(fs.readFileSync(fullPath, "utf8"), context, {
    filename: relativePath
  });
}
