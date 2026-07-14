#!/usr/bin/env node

import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";

const experimentRoot = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(readFileSync(resolve(experimentRoot, "manifest.json"), "utf8"));
const uaRoot = process.env.UA_ROOT;

if (!uaRoot) {
  process.stderr.write("Set UA_ROOT to an Understand-Anything checkout.\n");
  process.exit(2);
}

const skillRoot = resolve(uaRoot, "understand-anything-plugin/skills/understand");
const scanScript = resolve(skillRoot, "scan-project.mjs");
const extractScript = resolve(skillRoot, "extract-structure.mjs");

function run(command, args) {
  const startedAt = new Date().toISOString();
  const start = performance.now();
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
    timeout: 30 * 60 * 1000,
  });
  return {
    command: [command, ...args].map(sanitizePath),
    startedAt,
    runtimeSeconds: Number(((performance.now() - start) / 1000).toFixed(3)),
    exitCode: result.status,
    signal: result.signal,
    stdout: sanitizePath(result.stdout ?? ""),
    stderr: sanitizePath(result.stderr ?? ""),
    error: result.error?.message ?? null,
  };
}

function sanitizePath(value) {
  return String(value)
    .replaceAll(process.execPath, "<NODE>")
    .replaceAll(resolve(uaRoot), "<UA_ROOT>")
    .replaceAll(resolve(experimentRoot, "..", ".."), "<PROJECT_ROOT>");
}

for (const sample of manifest.samples) {
  const sampleRoot = resolve(experimentRoot, "samples", sample.id);
  const resultRoot = resolve(experimentRoot, "results", sample.id, "understand-anything");
  mkdirSync(resultRoot, { recursive: true });

  const scanPath = resolve(resultRoot, "scan.json");
  const inputPath = resolve(resultRoot, "extract-input.json");
  const outputPath = resolve(resultRoot, "structure.json");

  const scanPathArg = relative(process.cwd(), scanPath);
  const inputPathArg = relative(process.cwd(), inputPath);
  const outputPathArg = relative(process.cwd(), outputPath);
  const sampleRootArg = relative(process.cwd(), sampleRoot);
  const scan = run(process.execPath, [scanScript, sampleRootArg, scanPathArg]);
  let extract = null;

  if (scan.exitCode === 0) {
    const scanArtifact = JSON.parse(readFileSync(scanPath, "utf8"));
    writeFileSync(
      inputPath,
      JSON.stringify(
        {
          projectRoot: sampleRootArg,
          batchFiles: scanArtifact.files,
          batchImportData: {},
        },
        null,
        2,
      ),
    );
    extract = run(process.execPath, [extractScript, inputPathArg, outputPathArg]);
  }

  const metadata = {
    provider: "understand-anything",
    providerCommit: manifest.providers.understandAnything.commit,
    sample: sample.id,
    sampleCommit: sample.commit,
    scan,
    extract,
    artifactBytes: extract?.exitCode === 0 ? statSync(outputPath).size : 0,
  };
  writeFileSync(resolve(resultRoot, "run.json"), JSON.stringify(metadata, null, 2));

  process.stdout.write(
    `${sample.id}: scan=${scan.exitCode} extract=${extract?.exitCode ?? "skipped"} ` +
      `runtime=${(scan.runtimeSeconds + (extract?.runtimeSeconds ?? 0)).toFixed(3)}s\n`,
  );
}
