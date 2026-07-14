#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";

const experimentRoot = resolve(import.meta.dirname, "..");
const projectRoot = resolve(experimentRoot, "..", "..");
const manifest = JSON.parse(readFileSync(resolve(experimentRoot, "manifest.json"), "utf8"));
const codegraphBin = process.env.CODEGRAPH_BIN;

if (!codegraphBin) {
  process.stderr.write("Set CODEGRAPH_BIN to the pinned CodeGraph executable.\n");
  process.exit(2);
}

function sanitizePath(value) {
  return String(value)
    .replaceAll(resolve(codegraphBin), "<CODEGRAPH_BIN>")
    .replaceAll(projectRoot, "<PROJECT_ROOT>");
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

function queryJson(databasePath, sql) {
  const result = spawnSync("sqlite3", ["-json", databasePath, sql], {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || `sqlite3 exited ${result.status}`);
  }
  return result.stdout.trim() ? JSON.parse(result.stdout) : [];
}

for (const sample of manifest.samples) {
  const sampleRoot = resolve(experimentRoot, "samples", sample.id);
  const resultRoot = resolve(experimentRoot, "results", sample.id, "codegraph");
  const liveIndexRoot = resolve(sampleRoot, ".codegraph");
  const liveDatabase = resolve(liveIndexRoot, "codegraph.db");
  const liveErrorLog = resolve(liveIndexRoot, "errors.log");
  const copiedDatabase = resolve(resultRoot, "codegraph.db");
  const sampleRootArg = relative(process.cwd(), sampleRoot);

  rmSync(liveIndexRoot, { recursive: true, force: true });
  rmSync(resultRoot, { recursive: true, force: true });
  mkdirSync(resultRoot, { recursive: true });

  const index = run(codegraphBin, ["init", sampleRootArg]);
  let artifactBytes = 0;
  let exportError = null;
  let indexOutcome = null;

  if (index.exitCode === 0 && existsSync(liveDatabase)) {
    try {
      const graph = {
        nodes: queryJson(liveDatabase, "SELECT * FROM nodes ORDER BY id"),
        edges: queryJson(liveDatabase, "SELECT * FROM edges ORDER BY id"),
        files: queryJson(liveDatabase, "SELECT * FROM files ORDER BY path"),
        unresolvedReferences: queryJson(liveDatabase, "SELECT * FROM unresolved_refs ORDER BY id"),
        projectMetadata: queryJson(liveDatabase, "SELECT * FROM project_metadata ORDER BY key"),
      };
      writeFileSync(resolve(resultRoot, "graph.json"), JSON.stringify(graph, null, 2));
      indexOutcome = {
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
        trackedFileCount: graph.files.length,
        unresolvedReferenceCount: graph.unresolvedReferences.length,
        structuralFactsProduced: graph.nodes.some((node) => node.kind !== "file"),
        cliReportedFailure: index.stdout.includes("Indexing failed"),
      };
      copyFileSync(liveDatabase, copiedDatabase);
      artifactBytes = statSync(copiedDatabase).size;
      if (existsSync(liveErrorLog)) {
        writeFileSync(
          resolve(resultRoot, "errors.log"),
          sanitizePath(readFileSync(liveErrorLog, "utf8")),
        );
      }
    } catch (error) {
      exportError = error.message;
    }
  }

  const metadata = {
    provider: "codegraph",
    providerCommit: manifest.providers.codegraph.commit,
    providerVersion: manifest.providers.codegraph.version,
    sample: sample.id,
    sampleCommit: sample.commit,
    index,
    artifactBytes,
    exportError,
    indexOutcome,
    indexPolicy: "fresh-empty-.codegraph-per-sample",
  };
  writeFileSync(resolve(resultRoot, "run.json"), JSON.stringify(metadata, null, 2));

  process.stdout.write(
    `${sample.id}: index=${index.exitCode} runtime=${index.runtimeSeconds.toFixed(3)}s ` +
      `artifact=${artifactBytes}B export=${exportError ?? "ok"}\n`,
  );
}
