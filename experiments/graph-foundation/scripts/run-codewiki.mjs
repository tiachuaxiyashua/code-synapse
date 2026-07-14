#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";

const experimentRoot = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(readFileSync(resolve(experimentRoot, "manifest.json"), "utf8"));
const codewikiBin = process.env.CODEWIKI_BIN;
const cacheRunRoot = process.env.CODEWIKI_CACHE_ROOT;

if (!codewikiBin || !cacheRunRoot) {
  process.stderr.write("Set CODEWIKI_BIN and CODEWIKI_CACHE_ROOT.\n");
  process.exit(2);
}

function run(command, args, options = {}) {
  const startedAt = new Date().toISOString();
  const start = performance.now();
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
    timeout: 30 * 60 * 1000,
    ...options,
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
  return String(value).replaceAll(resolve(experimentRoot, "..", ".."), "<PROJECT_ROOT>");
}

function queryJson(databasePath, sql) {
  const result = spawnSync("sqlite3", ["-json", databasePath, sql], {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || `sqlite3 exited ${result.status}`);
  }
  return result.stdout.trim() ? JSON.parse(result.stdout) : [];
}

for (const sample of manifest.samples) {
  const sampleRoot = resolve(experimentRoot, "samples", sample.id);
  const resultRoot = resolve(experimentRoot, "results", sample.id, "codewiki");
  const liveDatabase = resolve(sampleRoot, ".codewiki", "codewiki-lite.sqlite3");
  const copiedDatabase = resolve(resultRoot, "codewiki-lite.sqlite3");
  const sampleRootArg = relative(process.cwd(), sampleRoot);
  const sampleCacheRoot = resolve(cacheRunRoot, sample.id);
  const sampleCacheRootArg = relative(process.cwd(), sampleCacheRoot);
  if (existsSync(sampleCacheRoot)) {
    throw new Error(`Cold-run AST cache already exists: ${sampleCacheRootArg}`);
  }
  mkdirSync(resultRoot, { recursive: true });

  const index = run(
    codewikiBin,
    ["lite", "index", sampleRootArg, "--force", "--json"],
    { env: { ...process.env, CODEWIKI_STORAGE_DIR: sampleCacheRootArg } },
  );
  let artifactBytes = 0;
  let exportError = null;

  if (index.exitCode === 0 && existsSync(liveDatabase)) {
    copyFileSync(liveDatabase, copiedDatabase);
    artifactBytes = statSync(copiedDatabase).size;
    try {
      const graph = {
        nodes: queryJson(copiedDatabase, "SELECT * FROM code_node ORDER BY id"),
        edges: queryJson(copiedDatabase, "SELECT * FROM code_edge ORDER BY id"),
      };
      writeFileSync(resolve(resultRoot, "graph.json"), JSON.stringify(graph, null, 2));
    } catch (error) {
      exportError = error.message;
    }
  }

  const metadata = {
    provider: "codewiki",
    providerCommit: manifest.providers.codewiki.commit,
    sample: sample.id,
    sampleCommit: sample.commit,
    index,
    artifactBytes,
    exportError,
    astCachePolicy: "fresh-empty-per-sample",
  };
  writeFileSync(resolve(resultRoot, "run.json"), JSON.stringify(metadata, null, 2));

  process.stdout.write(
    `${sample.id}: index=${index.exitCode} runtime=${index.runtimeSeconds.toFixed(3)}s ` +
      `artifact=${artifactBytes}B\n`,
  );
}
