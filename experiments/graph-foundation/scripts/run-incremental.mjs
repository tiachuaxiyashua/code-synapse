#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { relative, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { spawnSync } from "node:child_process";

const projectRoot = resolve(import.meta.dirname, "../../..");
const experimentRoot = resolve(import.meta.dirname, "..");
const resultsRoot = resolve(experimentRoot, "results", "incremental");
const workRoot = process.env.INCREMENTAL_WORK_ROOT
  ? resolve(process.env.INCREMENTAL_WORK_ROOT)
  : resolve(experimentRoot, "work", "incremental");
const sampleSource = resolve(experimentRoot, "samples", "bulletproof-nodejs");
const codegraphBin = process.env.CODEGRAPH_BIN;
const codewikiBin = process.env.CODEWIKI_BIN;
const uaRoot = process.env.UA_ROOT;

if (!codegraphBin || !codewikiBin || !uaRoot) {
  process.stderr.write("Set CODEGRAPH_BIN, CODEWIKI_BIN, and UA_ROOT.\n");
  process.exit(2);
}
if (existsSync(workRoot)) {
  process.stderr.write("Incremental work directory already exists; preserve it or move it before rerunning.\n");
  process.exit(2);
}

mkdirSync(resultsRoot, { recursive: true });
mkdirSync(workRoot, { recursive: true });

const uaSkillRoot = resolve(uaRoot, "understand-anything-plugin/skills/understand");
const uaScanScript = resolve(uaSkillRoot, "scan-project.mjs");
const uaExtractScript = resolve(uaSkillRoot, "extract-structure.mjs");
const uaBatchesScript = resolve(uaSkillRoot, "compute-batches.mjs");

function sanitize(value) {
  return String(value)
    .replaceAll(process.execPath, "<NODE>")
    .replaceAll(resolve(codegraphBin), "<CODEGRAPH_BIN>")
    .replaceAll(resolve(uaRoot), "<UA_ROOT>")
    .replaceAll(projectRoot, "<PROJECT_ROOT>");
}

function run(command, args, options = {}) {
  const start = performance.now();
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
    timeout: 30 * 60 * 1000,
    ...options,
  });
  return {
    command: [command, ...args].map(sanitize),
    runtimeSeconds: Number(((performance.now() - start) / 1000).toFixed(3)),
    exitCode: result.status,
    signal: result.signal,
    stdout: sanitize(result.stdout ?? ""),
    stderr: sanitize(result.stderr ?? ""),
    error: result.error?.message ?? null,
  };
}

function mustRun(command, args, options) {
  const result = run(command, args, options);
  if (result.exitCode !== 0) {
    throw new Error(`${result.command.join(" ")} failed: ${result.stderr || result.signal}`);
  }
  return result;
}

function cloneFor(provider, source = sampleSource) {
  const target = resolve(workRoot, provider);
  mustRun("git", ["clone", "--quiet", "--no-hardlinks", source, target]);
  mustRun("git", ["-C", target, "config", "user.email", "experiment@code-synapse.local"]);
  mustRun("git", ["-C", target, "config", "user.name", "Code Synapse Experiment"]);
  return target;
}

function applyControlledChange(repository) {
  const sourcePath = resolve(repository, "src/services/auth.ts");
  const source = readFileSync(sourcePath, "utf8");
  const marker = "codeSynapseIncrementalProbe";
  if (source.includes(marker)) throw new Error("Controlled change already exists");
  const replacement = [
    "",
    `  private ${marker}(user) {`,
    "    return this.generateToken(user);",
    "  }",
    "}",
    "",
  ].join("\n");
  writeFileSync(sourcePath, source.replace(/\n}\s*$/, replacement));
  return "src/services/auth.ts";
}

function commitControlledChange(repository, changedFile = "src/services/auth.ts") {
  mustRun("git", ["-C", repository, "add", changedFile]);
  mustRun("git", ["-C", repository, "commit", "--quiet", "-m", "experiment: controlled structural change"]);
}

function addControlledChange(repository) {
  const changedFile = applyControlledChange(repository);
  commitControlledChange(repository, changedFile);
  return changedFile;
}

function parseJsonStdout(result) {
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}

function queryJson(databasePath, sql) {
  const result = spawnSync("sqlite3", ["-json", databasePath, sql], {
    cwd: projectRoot,
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(result.stderr || `sqlite3 exited ${result.status}`);
  return result.stdout.trim() ? JSON.parse(result.stdout) : [];
}

function codegraphSnapshot(repository) {
  const databasePath = resolve(repository, ".codegraph", "codegraph.db");
  const nodes = queryJson(
    databasePath,
    "SELECT id, kind, qualified_name, file_path, start_line, end_line FROM nodes ORDER BY id",
  );
  const edges = queryJson(
    databasePath,
    "SELECT source, target, kind, line, col FROM edges ORDER BY source, target, kind, line, col",
  );
  const probeNodes = queryJson(
    databasePath,
    "SELECT id, kind, name, qualified_name, file_path, start_line, end_line FROM nodes WHERE name = 'codeSynapseIncrementalProbe'",
  );
  const probeCalls = queryJson(
    databasePath,
    "SELECT s.name source_name, t.name target_name, e.kind, e.line FROM edges e JOIN nodes s ON s.id=e.source JOIN nodes t ON t.id=e.target WHERE s.name='codeSynapseIncrementalProbe' AND t.name='generateToken' AND e.kind='calls'",
  );
  return {
    databasePath: sanitize(databasePath),
    artifactBytes: statSync(databasePath).size,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    probeNodes,
    probeCalls,
    nodeIdentities: nodes.map((node) => JSON.stringify(node)),
    edgeIdentities: edges.map((edge) => JSON.stringify(edge)),
  };
}

function parity(left, right) {
  const rightSet = new Set(right);
  const leftSet = new Set(left);
  return {
    equal: left.length === right.length && left.every((item) => rightSet.has(item)),
    incrementalOnly: left.filter((item) => !rightSet.has(item)),
    fullOnly: right.filter((item) => !leftSet.has(item)),
  };
}

const codegraphRepository = cloneFor("codegraph");
const codegraphPath = relative(projectRoot, codegraphRepository);
const codegraphBaseline = mustRun(codegraphBin, ["init", codegraphPath]);
const codegraphChangedFile = applyControlledChange(codegraphRepository);
const codegraphPending = mustRun(codegraphBin, ["status", "--json", codegraphPath]);
const codegraphSync = mustRun(codegraphBin, ["sync", codegraphPath]);
const codegraphAfter = mustRun(codegraphBin, ["status", "--json", codegraphPath]);
const codegraphIncrementalSnapshot = codegraphSnapshot(codegraphRepository);
commitControlledChange(codegraphRepository, codegraphChangedFile);

const codegraphFullRepository = cloneFor("codegraph-full-rebuild", codegraphRepository);
const codegraphFullPath = relative(projectRoot, codegraphFullRepository);
const codegraphFullRun = mustRun(codegraphBin, ["init", codegraphFullPath]);
const codegraphFullSnapshot = codegraphSnapshot(codegraphFullRepository);
const codegraphParity = {
  nodes: parity(codegraphIncrementalSnapshot.nodeIdentities, codegraphFullSnapshot.nodeIdentities),
  edges: parity(codegraphIncrementalSnapshot.edgeIdentities, codegraphFullSnapshot.edgeIdentities),
};
delete codegraphIncrementalSnapshot.nodeIdentities;
delete codegraphIncrementalSnapshot.edgeIdentities;
delete codegraphFullSnapshot.nodeIdentities;
delete codegraphFullSnapshot.edgeIdentities;

const codewikiRepository = cloneFor("codewiki");
const codewikiPath = relative(projectRoot, codewikiRepository);
const codewikiBaseline = mustRun(codewikiBin, ["lite", "index", codewikiPath, "--force", "--json"]);
const codewikiChangedFile = addControlledChange(codewikiRepository);
const codewikiPending = mustRun(codewikiBin, ["lite", "status", codewikiPath, "--json"]);
const codewikiSync = mustRun(codewikiBin, ["lite", "sync", codewikiPath, "--json"]);
const codewikiAfter = mustRun(codewikiBin, ["lite", "status", codewikiPath, "--json"]);

const uaRepository = cloneFor("understand-anything");
const uaPath = relative(projectRoot, uaRepository);
const uaOutputRoot = resolve(uaRepository, ".ua", "intermediate");
mkdirSync(uaOutputRoot, { recursive: true });
const uaScanPath = resolve(uaOutputRoot, "scan-result.json");
const uaScan = mustRun(process.execPath, [uaScanScript, uaPath, relative(projectRoot, uaScanPath)]);
const uaScanArtifact = JSON.parse(readFileSync(uaScanPath, "utf8"));
uaScanArtifact.importMap = {};
writeFileSync(uaScanPath, JSON.stringify(uaScanArtifact, null, 2));

const uaBaselineInput = resolve(uaOutputRoot, "baseline-input.json");
const uaBaselineOutput = resolve(uaOutputRoot, "baseline-structure.json");
writeFileSync(
  uaBaselineInput,
  JSON.stringify({ projectRoot: uaPath, batchFiles: uaScanArtifact.files, batchImportData: {} }, null, 2),
);
const uaBaseline = mustRun(process.execPath, [uaExtractScript, relative(projectRoot, uaBaselineInput), relative(projectRoot, uaBaselineOutput)]);
const uaChangedFile = addControlledChange(uaRepository);
const changedFilesPath = resolve(uaRepository, ".ua", "changed-files.txt");
writeFileSync(changedFilesPath, `${uaChangedFile}\n`);
const uaPlan = mustRun(process.execPath, [
  uaBatchesScript,
  uaPath,
  `--changed-files=${relative(projectRoot, changedFilesPath)}`,
]);
const batches = JSON.parse(readFileSync(resolve(uaOutputRoot, "batches.json"), "utf8"));
const incrementalFiles = [...new Set(batches.batches.flatMap((batch) => batch.files.map((file) => file.path)))];
const incrementalInput = resolve(uaOutputRoot, "incremental-input.json");
const incrementalOutput = resolve(uaOutputRoot, "incremental-structure.json");
writeFileSync(
  incrementalInput,
  JSON.stringify({ projectRoot: uaPath, batchFiles: batches.batches.flatMap((batch) => batch.files), batchImportData: {} }, null, 2),
);
const uaIncremental = mustRun(process.execPath, [uaExtractScript, relative(projectRoot, incrementalInput), relative(projectRoot, incrementalOutput)]);

const result = {
  schemaVersion: 1,
  sample: "bulletproof-nodejs",
  controlledChange: {
    file: codewikiChangedFile,
    addedMethod: "codeSynapseIncrementalProbe",
    addedCall: "generateToken",
  },
  codegraph: {
    baseline: { run: codegraphBaseline },
    pending: { run: codegraphPending, output: parseJsonStdout(codegraphPending) },
    sync: { run: codegraphSync },
    after: { run: codegraphAfter, output: parseJsonStdout(codegraphAfter) },
    incremental: codegraphIncrementalSnapshot,
    fullRebuild: { run: codegraphFullRun, ...codegraphFullSnapshot },
    parity: codegraphParity,
  },
  codewiki: {
    baseline: { run: codewikiBaseline, output: parseJsonStdout(codewikiBaseline) },
    pending: parseJsonStdout(codewikiPending),
    sync: { run: codewikiSync, output: parseJsonStdout(codewikiSync) },
    after: parseJsonStdout(codewikiAfter),
  },
  understandAnything: {
    baseline: { run: uaBaseline, fileCount: uaScanArtifact.files.length, artifactBytes: statSync(uaBaselineOutput).size },
    plan: { run: uaPlan, batchCount: batches.batches.length, incrementalFiles },
    incremental: { run: uaIncremental, fileCount: incrementalFiles.length, artifactBytes: statSync(incrementalOutput).size },
    fullSkillCaveat: "The deterministic file pass is scoped; the documented full Skill re-runs architecture analysis over the merged graph.",
  },
};

writeFileSync(resolve(resultsRoot, "result.json"), JSON.stringify(result, null, 2));
process.stdout.write(`${relative(projectRoot, resolve(resultsRoot, "result.json"))}\n`);
