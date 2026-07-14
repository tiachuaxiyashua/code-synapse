# Superseded Core Feasibility Experiment Implementation Plan

> **Status:** Superseded by `docs/superpowers/plans/2026-07-14-semantic-zoom-feasibility.md`. This plan used click-to-open child scopes, React Flow as the assumed renderer, and a separate code view; those choices conflict with the confirmed separate-canvas/global-semantic-zoom/source-drawer model.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove or disprove that existing CodeGraph evidence plus one bounded AI pass can produce a faithful, beginner-readable capability tree and progressively drillable flow with conditions, data transfers, and exact source evidence.

**Architecture:** Reuse the fixed `bulletproof-nodejs` TypeScript sample, its existing CodeGraph SQLite database, the system `sqlite3` executable, the current AI coding agent, and the disposable Vite prototype. One Node script builds a bounded evidence pack, the agent emits one inspectable semantic JSON file, one validator rejects unsupported structure/evidence, and one standalone prototype page renders feature, flow, and code views from that JSON.

**Tech Stack:** Existing Node.js runtime, Node standard library, `sqlite3` CLI, existing React/Vite/React Flow prototype. No new packages.

**Ponytail Gate:** passed - replaced the 15-task production foundation with one real TypeScript vertical experiment; deferred general CFG, Python, canonical persistence, production CLI, incremental updates, packaging, and specialized renderers until the human-model hypothesis passes.

---

## Experiment Boundary

The selected real scope is user authentication in `experiments/graph-foundation/samples/bulletproof-nodejs`. It includes HTTP routes, service calls, success/failure branches, dependency injection, configuration, token generation, email, event dispatch, and an event subscriber. This is one bounded feasibility case, not claimed language or framework coverage.

The experiment passes only after both machine validation and user comprehension review pass. A technically valid JSON file alone is not success.

## Ponytail Review Result

The original plan was rejected because 14 of its 15 tasks built reusable infrastructure before the first user-facing result existed. This experiment keeps only the five things needed to test the core claim: real structural evidence, exact source, one AI semantic pass, real drill-down in a browser, and a measured human review.

Deferred until this experiment passes: a production package, general SQLite adapter, stable global identities, reusable language-provider interfaces, deterministic general CFG, Python, comprehensive configuration binding, canonical `.code_synapse/` persistence, production CLI, incremental invalidation, cold-rebuild recovery, Skills, packaging, and specialized diagram renderers.

### Task 1: Build One Bounded Evidence Pack

**Files:**
- Create: `experiments/core-feasibility/build-evidence.mjs`
- Create: `experiments/core-feasibility/evidence.json` (generated)

- [ ] **Step 1: Create the extractor with no new dependency**

Implement `build-evidence.mjs` with fixed experiment paths and fixed source files:

```js
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, "../..");
const sampleRoot = resolve(projectRoot, "experiments/graph-foundation/samples/bulletproof-nodejs");
const database = resolve(projectRoot, "experiments/graph-foundation/results/bulletproof-nodejs/codegraph/codegraph.db");
const selectedFiles = [
  "src/api/routes/auth.ts",
  "src/config/index.ts",
  "src/decorators/eventDispatcher.ts",
  "src/interfaces/IUser.ts",
  "src/models/user.ts",
  "src/services/auth.ts",
  "src/services/mailer.ts",
  "src/subscribers/events.ts",
  "src/subscribers/user.ts",
];

function sqlList(values) {
  return values.map((value) => `'${value.replaceAll("'", "''")}'`).join(",");
}

function query(sql) {
  const result = spawnSync("sqlite3", ["-json", database, sql], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(result.stderr || `sqlite3 exited ${result.status}`);
  return result.stdout.trim() ? JSON.parse(result.stdout) : [];
}

const files = sqlList(selectedFiles);
const nodes = query(`
  SELECT id, kind, name, qualified_name, file_path, language,
         start_line, end_line, start_column, end_column, signature
  FROM nodes WHERE file_path IN (${files}) ORDER BY file_path, start_line, id
`);
const edges = query(`
  SELECT e.id, e.kind, e.source, s.qualified_name AS source_name,
         e.target, t.qualified_name AS target_name, e.line, e.col,
         e.provenance, e.metadata
  FROM edges e
  JOIN nodes s ON s.id = e.source
  JOIN nodes t ON t.id = e.target
  WHERE s.file_path IN (${files}) OR t.file_path IN (${files})
  ORDER BY e.id
`);
const unresolved = query(`
  SELECT id, from_node_id, reference_name, reference_kind, line, col,
         candidates, file_path, language, status
  FROM unresolved_refs WHERE file_path IN (${files}) ORDER BY file_path, line, col
`);
const sources = Object.fromEntries(selectedFiles.map((path) => [
  path,
  readFileSync(resolve(sampleRoot, path), "utf8").split("\n"),
]));

writeFileSync(resolve(here, "evidence.json"), JSON.stringify({
  experiment: "bulletproof-nodejs-auth",
  provider: {name: "codegraph", version: "1.4.1", schema: 8, extraction: 24},
  selectedFiles,
  nodes,
  edges,
  unresolved,
  sources,
}, null, 2));
```

- [ ] **Step 2: Run the extractor**

Run: `node experiments/core-feasibility/build-evidence.mjs`

Expected: `evidence.json` contains all nine source files, nonempty nodes and edges, `AuthService::SignUp`, `AuthService::SignIn`, `UserSubscriber::onUserSignUp`, and the exact source lines.

- [ ] **Step 3: Add one runnable extraction check**

Run:

```bash
node -e "const e=require('./experiments/core-feasibility/evidence.json'); const names=e.nodes.map(n=>n.qualified_name); if(!names.includes('AuthService::SignUp')||!names.includes('AuthService::SignIn')||!e.sources['src/api/routes/auth.ts']) process.exit(1)"
```

Expected: exit code `0`.

### Task 2: Generate And Validate The Human Semantic Graph

**Files:**
- Create: `experiments/core-feasibility/AI_PROMPT.md`
- Create: `experiments/core-feasibility/semantic.json` (AI generated)
- Create: `experiments/core-feasibility/validate.mjs`
- Create: `prototype/src/generated/core-feasibility.json` (generated by validator)

- [ ] **Step 1: Write the bounded AI contract**

`AI_PROMPT.md` must instruct the current coding agent to read only `evidence.json` for program claims and emit `semantic.json` with this exact shape:

```json
{
  "featureTree": {
    "id": "string",
    "label": "Chinese beginner-facing label",
    "purpose": "string",
    "evidence": [{"path": "relative/path", "startLine": 1, "endLine": 1}],
    "children": []
  },
  "scopes": {
    "scope-id": {
      "id": "scope-id",
      "parentScopeId": null,
      "title": "string",
      "purpose": "string",
      "nodes": [{
        "id": "string",
        "label": "string",
        "purpose": "string",
        "kind": "operation|decision|event|external-boundary|analysis-gap",
        "input": "string",
        "output": "string",
        "childScopeId": null,
        "order": 0,
        "lane": 0,
        "evidence": [{"path": "relative/path", "startLine": 1, "endLine": 1}]
      }],
      "edges": [{
        "id": "string",
        "source": "node-id",
        "target": "node-id",
        "kind": "control|data|event",
        "label": "what crosses this edge",
        "condition": null,
        "result": null,
        "evidence": [{"path": "relative/path", "startLine": 1, "endLine": 1}]
      }]
    }
  },
  "gaps": [{
    "status": "analysis-gap|external-boundary",
    "description": "string",
    "evidence": [{"path": "relative/path", "startLine": 1, "endLine": 1}]
  }]
}
```

Each `featureTree.children` item has exactly `id`, `label`, `purpose`, and `evidence`. The root feature ID equals the root scope ID; each child feature ID equals its flow scope ID. Every non-root scope has a valid `parentScopeId` and is referenced by exactly one parent-flow node through `childScopeId`, so all generated scopes are reachable by real drill-down.

The prompt also requires:

- one capability with two to five use cases;
- one parent authentication flow and at least two real child flows;
- one success/failure decision with both outcomes;
- the sign-up event dispatch and its repository consumer or an explicit gap;
- actual arguments/results/event payloads on edges;
- unchanged source identifiers inside explanations;
- evidence for every feature, node, edge, and gap;
- no behavior copied from `prototype/src/model.js`, no invented session/cache flow, and no claims based only on comments marked `TODO`;
- JSON only, with no layout coordinates beyond semantic `order` and `lane`.

- [ ] **Step 2: Ask the current AI coding agent for one semantic pass**

Instruction to the agent:

```text
Read experiments/core-feasibility/AI_PROMPT.md and
experiments/core-feasibility/evidence.json. Write only the requested artifact to
experiments/core-feasibility/semantic.json. Do not read prototype/src/model.js
or any review result while generating it.
```

- [ ] **Step 3: Implement one structural/evidence validator**

`validate.mjs` reads `evidence.json` and `semantic.json`, then asserts:

```js
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const evidence = JSON.parse(readFileSync(resolve(here, "evidence.json"), "utf8"));
const semantic = JSON.parse(readFileSync(resolve(here, "semantic.json"), "utf8"));

function checkEvidence(items, owner) {
  assert.ok(Array.isArray(items) && items.length > 0, `${owner} has no evidence`);
  for (const item of items) {
    const lines = evidence.sources[item.path];
    assert.ok(lines, `${owner} cites unselected path ${item.path}`);
    assert.ok(Number.isInteger(item.startLine) && item.startLine >= 1, `${owner} has invalid startLine`);
    assert.ok(Number.isInteger(item.endLine) && item.endLine >= item.startLine, `${owner} has invalid endLine`);
    assert.ok(item.endLine <= lines.length, `${owner} evidence exceeds ${item.path}`);
  }
}

checkEvidence(semantic.featureTree.evidence, "featureTree");
for (const child of semantic.featureTree.children) checkEvidence(child.evidence, `feature ${child.id}`);

const scopes = Object.values(semantic.scopes);
assert.ok(scopes.length >= 3, "need parent and at least two child scopes");
assert.ok(semantic.scopes[semantic.featureTree.id], "feature root has no root flow");
for (const child of semantic.featureTree.children) {
  assert.ok(semantic.scopes[child.id], `feature ${child.id} has no flow scope`);
}
const childReferences = new Map();
let branchCount = 0;
let eventCount = 0;
for (const scope of scopes) {
  const nodeIds = new Set(scope.nodes.map((node) => node.id));
  assert.equal(nodeIds.size, scope.nodes.length, `duplicate node in ${scope.id}`);
  for (const node of scope.nodes) {
    checkEvidence(node.evidence, `node ${scope.id}/${node.id}`);
    if (node.childScopeId !== null) {
      const child = semantic.scopes[node.childScopeId];
      assert.ok(child, `missing child ${node.childScopeId}`);
      assert.equal(child.parentScopeId, scope.id, `wrong parent for ${node.childScopeId}`);
      childReferences.set(node.childScopeId, (childReferences.get(node.childScopeId) || 0) + 1);
    }
  }
  for (const edge of scope.edges) {
    assert.ok(nodeIds.has(edge.source) && nodeIds.has(edge.target), `dangling edge ${scope.id}/${edge.id}`);
    assert.ok(edge.label.trim(), `edge ${scope.id}/${edge.id} does not say what crosses it`);
    checkEvidence(edge.evidence, `edge ${scope.id}/${edge.id}`);
    if (edge.condition !== null) branchCount += 1;
    if (edge.kind === "event") eventCount += 1;
  }
}
for (const scope of scopes) {
  if (scope.id === semantic.featureTree.id) assert.equal(scope.parentScopeId, null, "root scope has a parent");
  else assert.equal(childReferences.get(scope.id), 1, `scope ${scope.id} is not reachable exactly once`);
}
for (const gap of semantic.gaps) checkEvidence(gap.evidence, `gap ${gap.description}`);
assert.ok(branchCount >= 2, "need both decision outcomes");
assert.ok(eventCount >= 1, "need an event path");

const target = resolve(root, "prototype/src/generated/core-feasibility.json");
mkdirSync(dirname(target), {recursive: true});
writeFileSync(target, JSON.stringify({semantic, sources: evidence.sources}, null, 2));
```

- [ ] **Step 4: Validate before rendering**

Run: `node experiments/core-feasibility/validate.mjs`

Expected: exit `0` and a generated `prototype/src/generated/core-feasibility.json`. Any missing evidence, dangling flow edge, missing drill-down scope, missing branch outcome, or missing event path fails the experiment before UI work.

### Task 3: Render The Generated Result In A Throwaway Viewer

**Files:**
- Create: `prototype/feasibility.html`
- Create: `prototype/src/feasibility.jsx`

- [ ] **Step 1: Add a separate Vite entry page**

```html
<!doctype html>
<html lang="zh-CN">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Code Synapse 可行性验证</title></head>
  <body><div id="root"></div><script type="module" src="/src/feasibility.jsx"></script></body>
</html>
```

- [ ] **Step 2: Implement only three query-driven views in one component**

`feasibility.jsx` imports the generated JSON and existing `@xyflow/react` styles. It reads `view`, `scope`, and optional `node` query parameters.

- `view=features`: render the capability and use-case tree; every use case opens `feasibility.html?view=flow&scope=<id>` in a new window.
- `view=flow`: render only the selected scope. Convert semantic `order`/`lane` to positions using `x = 80 + order * 260`, `y = 80 + lane * 170`. Double-clicking a node with `childScopeId` opens that child scope; the header links back to `parentScopeId`. Edge labels show data/event payloads and conditions/results without rewriting them.
- `view=code`: locate the selected node, show its purpose and exact cited source lines from `sources`, with original line numbers.

Use native buttons/links and the already-installed React Flow. Do not add search, settings, timelines, C4, tabs, fake confidence, feature-chain sections, inert toolbar buttons, persistence, or a backend. Add `title={node.purpose}` to rendered flow nodes so hover exposes the AI explanation near the node.

- [ ] **Step 3: Add the smallest navigation check**

Start the existing server:

```bash
cd prototype
npm run dev -- --port 4173
```

Open: `http://127.0.0.1:4173/feasibility.html?view=features`

Expected: feature selection opens a separate flow window; a composite node opens a real child flow; parent navigation returns; code evidence opens exact source lines; no content comes from the old hard-coded variants.

### Task 4: Make A Go/Revise/Stop Decision

**Files:**
- Create: `experiments/core-feasibility/review.md`
- Modify: `docs/design/product.md` only after the review result is known
- Modify: `docs/design/codegraph-foundation.md` only after the review result is known

- [ ] **Step 1: Perform technical truth review without editing the artifact**

Compare every displayed feature, node, condition, result, and transfer with its cited lines. Record counts in `review.md`:

```text
generator/model:
AI passes used:
evidence bytes:
semantic bytes:
unsupported claims:
missing critical steps:
wrong conditions/results:
wrong data/event transfers:
label/purpose corrections needed:
topology corrections needed:
```

Technical pass requires zero unsupported claims, zero missing critical route/service/branch/event steps, zero wrong conditions/results/transfers, at most two wording corrections, and zero manual topology corrections.

- [ ] **Step 2: Run the beginner comprehension review**

Without reading source first, the user uses only the three prototype views to answer:

1. What are the main authentication use cases?
2. What happens when sign-in cannot find a user, the password is wrong, or the password is valid?
3. What data crosses the route, `AuthService`, database model, password verifier, and token generator?
4. What event is emitted after sign-up, which repository handler receives it, and what does that handler actually implement today?
5. From the top-level flow, can you enter one child flow, return to its parent, and open the source evidence for a step without losing context?

Comprehension pass requires correct answers to questions 1-4 and successful navigation for question 5. Record the user's answers and unclear labels in `review.md`.

- [ ] **Step 3: Apply the decision rule**

- `GO`: both technical and comprehension reviews pass. Authorize only a narrow production TypeScript slice based on the demonstrated artifact.
- `REVISE`: evidence is sufficient but AI schema, prompt, hierarchy, or presentation caused failure. Change that layer and rerun this experiment; do not start foundation work.
- `STOP`: CodeGraph/source evidence cannot support the required human model without programmer reconstruction. Reconsider the foundation choice or product approach.

- [ ] **Step 4: Update canonical design with evidence, not optimism**

Record the measured result and next authorized scope in both canonical design documents. Do not mark the general CodeGraph foundation approved for implementation from a single successful TS experiment; Python, larger repositories, configuration selection, and specialized mechanisms remain separate gates.
