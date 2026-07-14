# CodeGraph Foundation Experiment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run `colbymchenry/codegraph` against the same six fixed repositories and ground truth as the existing foundation experiment, then make an evidence-backed first-provider decision.

**Architecture:** Treat CodeGraph as a third external provider. A dedicated runner produces pinned, inspectable SQLite and JSON artifacts; the existing evaluator normalizes those facts into the provider-neutral experiment shape; the incremental harness checks one controlled TypeScript edit independently of cold-run accuracy. Code Synapse remains the canonical model owner regardless of the provider decision.

**Tech Stack:** Node.js ESM scripts, CodeGraph TypeScript library/CLI, SQLite JSON export, existing JSON ground truth.

---

### Task 1: Pin And Run CodeGraph

**Files:**
- Modify: `experiments/graph-foundation/manifest.json`
- Create: `experiments/graph-foundation/scripts/run-codegraph.mjs`

- [x] **Step 1: Pin the provider before measuring it**

Add a `codegraph` provider entry containing repository URL, commit, version, deterministic local indexing mode, and `llmUsed: false`.

- [x] **Step 2: Implement a cold-run exporter**

For every manifest sample, invoke the pinned CodeGraph executable with a fresh `.codegraph` directory, copy `codegraph.db`, and export `nodes`, `edges`, `files`, and `unresolved_refs` to `results/<sample>/codegraph/graph.json`. Record command, runtime, exit status, artifact size, provider commit, and sample commit in `run.json`.

- [x] **Step 3: Verify the runner before the full experiment**

Run:

```bash
node --check experiments/graph-foundation/scripts/run-codegraph.mjs
CODEGRAPH_BIN=/path/to/pinned/codegraph node experiments/graph-foundation/scripts/run-codegraph.mjs
```

Expected: six zero-exit runs or explicit unsupported-language artifacts; no sample is silently skipped.

### Task 2: Normalize And Evaluate CodeGraph

**Files:**
- Modify: `experiments/graph-foundation/scripts/evaluate.mjs`
- Modify: `experiments/graph-foundation/results/summary.json` (generated)

- [x] **Step 1: Add a CodeGraph adapter**

Map CodeGraph nodes and edges into the existing provider-neutral entity/relation fields. Preserve `providerId`, source range, call-site line, `provenance`, `metadata.confidence`, `metadata.resolvedBy`, unresolved status, and evidence location.

- [x] **Step 2: Evaluate all providers with one metric function**

Teach `evaluateProvider` how to read CodeGraph execution metadata, then add its metrics to every sample without changing the existing ground truth or matching rules.

- [x] **Step 3: Preserve pairwise comparison evidence**

Write `codegraph.normalized.json` and report CodeGraph-to-CodeWiki and CodeGraph-to-Understand-Anything overlap/conflict vectors separately; do not create a blind three-provider union.

- [x] **Step 4: Verify evaluator output**

Run:

```bash
node --check experiments/graph-foundation/scripts/evaluate.mjs
node experiments/graph-foundation/scripts/validate-ground-truth.mjs
node experiments/graph-foundation/scripts/evaluate.mjs
```

Expected: `summary.json` contains CodeGraph metrics for all six samples, and unsupported GDScript remains a declared capability gap.

### Task 3: Test Incremental Correctness

**Files:**
- Modify: `experiments/graph-foundation/scripts/run-incremental.mjs`
- Modify: `experiments/graph-foundation/results/incremental/result.json` (generated)

- [x] **Step 1: Add CodeGraph to the controlled edit**

Clone the same TypeScript sample, create the same `codeSynapseIncrementalProbe` method, run CodeGraph sync, and record changed-file scope, runtime, and graph counts.

- [x] **Step 2: Compare incremental output with a clean rebuild**

Export the incrementally updated graph and a clean full rebuild of the changed commit. Compare node and edge identities so a fast but stale incremental result cannot pass.

- [x] **Step 3: Run the incremental experiment**

Run:

```bash
CODEGRAPH_BIN=/path/to/pinned/codegraph CODEWIKI_BIN=/path/to/codewiki UA_ROOT=/path/to/ua \
  node experiments/graph-foundation/scripts/run-incremental.mjs
```

Expected: the changed method and call are present, unrelated files are not needlessly reprocessed, and incremental/full identities match or discrepancies are reported.

### Task 4: Decide And Record The Foundation

**Files:**
- Modify: `experiments/graph-foundation/results/REPORT.md`
- Modify: `docs/product/code_synapse-decisions.md`

- [x] **Step 1: Apply explicit decision gates**

Select CodeGraph as the first structural provider only if it executes reliably for TypeScript/JavaScript and Python, meets or exceeds the strongest tested provider on the declared symbol/call truths, preserves source/provenance/confidence evidence, and its incremental output is correct. C/C++/C#/GDScript gaps remain separate capability findings rather than being hidden by an aggregate score.

- [x] **Step 2: Write the report before changing the decision**

Record exact commit/version, environment, per-sample metric vectors, failures, incremental parity, licensing, integration surface, and the resulting recommendation in `REPORT.md`.

- [x] **Step 3: Update canonical product memory only if warranted**

If the gates pass, replace CodeWiki as the selected first structural provider with CodeGraph, retain CodeWiki as an optional GraphRAG/source-grounding provider, and record mandatory dedicated Clang/Roslyn/Godot providers. If the gates fail, record why CodeWiki remains first.

- [x] **Step 4: Final verification**

Run JSON parsing, script syntax checks, ground-truth validation, evaluator regeneration, and consistency searches across the decision document and report. Expected: provider roles and experiment evidence agree everywhere.
