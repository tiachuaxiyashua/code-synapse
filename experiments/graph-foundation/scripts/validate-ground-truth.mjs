#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const experimentRoot = resolve(import.meta.dirname, "..");
const truth = JSON.parse(readFileSync(resolve(experimentRoot, "ground-truth.json"), "utf8"));
const failures = [];

for (const [sample, checks] of Object.entries(truth.samples)) {
  const sampleRoot = resolve(experimentRoot, "samples", sample);
  for (const [kind, items] of Object.entries(checks)) {
    for (const item of items) {
      const lines = readFileSync(resolve(sampleRoot, item.file), "utf8").split("\n");
      const sourceLine = lines[item.line - 1] ?? "";
      const expected = kind === "symbols" ? item.name : item.callee;
      if (!sourceLine.includes(expected)) {
        failures.push({ sample, kind, item, sourceLine });
      }
    }
  }
}

if (failures.length) {
  process.stderr.write(`${JSON.stringify(failures, null, 2)}\n`);
  process.exit(1);
}

process.stdout.write("All declared source locations contain the expected symbol or callee name.\n");

