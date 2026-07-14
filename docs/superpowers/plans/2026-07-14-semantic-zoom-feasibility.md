# Semantic Zoom Feasibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove whether a feature tree plus separate capability and behavior canvases with global semantic zoom, middle-mouse pan, synchronized selection, and an adjacent source drawer helps a beginner understand one real TypeScript subsystem.

**Architecture:** Reuse the existing `bulletproof-nodejs` CodeGraph database, exact source, React/Vite shell, and browser SVG. Generate one evidence-backed semantic model with three precomputed detail bands; render capability and behavior in separate named windows using the same small camera hook and semantic IDs. All bands are local fixture data in Phase 0: the experiment validates meaning, navigation, position stability, and comprehension, not production chunk loading or final renderer selection.

**Tech Stack:** Existing Node.js runtime and `sqlite3` CLI; existing React 19, Vite 7, and lucide-react; native SVG, CSS transforms, Pointer Events, Wheel Events, and BroadcastChannel. No new packages and no React Flow.

**Ponytail Gate:** passed - implements only two representative diagram grammars and the shared interaction needed to test the confirmed model; defers the other eleven diagram types, Diff, production loaders, layout engines, large-project optimization, and reusable renderer architecture.

---

## Experiment Contract

The experiment uses the existing authentication subsystem in `experiments/graph-foundation/samples/bulletproof-nodejs`. The generated model must contain exact evidence and these three fixed semantic bands:

- `Z0`: authentication capabilities and complete top-level behavior summary;
- `Z1`: sign-up/sign-in sub-capabilities, route/service/event collaborations, main success/failure alternatives;
- `Z2`: function/handler operations, actual arguments/results/event payloads, state changes, and evidence markers.

The production design has five conceptual bands. Phase 0 intentionally implements three because two transitions are enough to test whether semantic zoom preserves context and improves understanding.

### Task 1: Generate One Evidence-Backed Three-Band Model

**Files:**
- Create: `experiments/semantic-zoom-feasibility/build-evidence.mjs`
- Create: `experiments/semantic-zoom-feasibility/AI_PROMPT.md`
- Create: `experiments/semantic-zoom-feasibility/evidence.json` (generated)
- Create: `experiments/semantic-zoom-feasibility/model.json` (AI generated)
- Create: `experiments/semantic-zoom-feasibility/validate.mjs`
- Create: `prototype/src/generated/semantic-zoom-model.json` (generated)

- [ ] **Step 1: Extract a bounded evidence pack with existing tools**

Implement the extractor with Node standard library and fixed experiment paths:

```js
import {readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const sample = resolve(root, "experiments/graph-foundation/samples/bulletproof-nodejs");
const database = resolve(root, "experiments/graph-foundation/results/bulletproof-nodejs/codegraph/codegraph.db");

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

const sqlList = selectedFiles.map((path) => `'${path.replaceAll("'", "''")}'`).join(",");
function query(sql) {
  const result = spawnSync("sqlite3", ["-json", database, sql], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(result.stderr || `sqlite3 exited ${result.status}`);
  return result.stdout.trim() ? JSON.parse(result.stdout) : [];
}

const nodes = query(`SELECT id,kind,name,qualified_name,file_path,language,start_line,end_line,start_column,end_column,signature FROM nodes WHERE file_path IN (${sqlList}) ORDER BY file_path,start_line,id`);
const edges = query(`SELECT e.id,e.kind,e.source,s.qualified_name source_name,e.target,t.qualified_name target_name,e.line,e.col,e.provenance,e.metadata FROM edges e JOIN nodes s ON s.id=e.source JOIN nodes t ON t.id=e.target WHERE s.file_path IN (${sqlList}) OR t.file_path IN (${sqlList}) ORDER BY e.id`);
const unresolved = query(`SELECT id,from_node_id,reference_name,reference_kind,line,col,candidates,file_path,language,status FROM unresolved_refs WHERE file_path IN (${sqlList}) ORDER BY file_path,line,col`);
const sources = Object.fromEntries(selectedFiles.map((path) => [path, readFileSync(resolve(sample, path), "utf8").split("\n")]));

writeFileSync(resolve(here, "evidence.json"), JSON.stringify({
  project: "bulletproof-auth",
  provider: {name: "codegraph", version: "1.4.1", schema: 8, extraction: 24},
  selectedFiles,
  nodes,
  edges,
  unresolved,
  sources,
}, null, 2));
```

Query `nodes`, `edges`, and `unresolved_refs` with `sqlite3 -json`; include each selected source as an array of original lines. Do not install a SQLite package or export the whole repository graph.

Run: `node experiments/semantic-zoom-feasibility/build-evidence.mjs`

Expected: `evidence.json` contains all selected sources plus `AuthService::SignUp`, `AuthService::SignIn`, `AuthService::generateToken`, `MailerService::SendWelcomeEmail`, and both `UserSubscriber` handlers.

- [ ] **Step 2: Define the semantic model contract**

`AI_PROMPT.md` instructs the current coding agent to use only `evidence.json` for program claims and output this shape:

```json
{
  "project": {"id": "bulletproof-auth", "label": "用户认证"},
  "features": [{
    "id": "semantic-id",
    "parentId": null,
    "label": "中文功能名",
    "purpose": "初学者可理解的作用",
    "targetId": "matching capability or behavior region id",
    "evidence": [{"path": "relative/path", "startLine": 1, "endLine": 1}]
  }],
  "diagrams": {
    "capability": {"bands": {"Z0": {"nodes": [], "edges": []}, "Z1": {"nodes": [], "edges": []}, "Z2": {"nodes": [], "edges": []}}},
    "behavior": {"bands": {"Z0": {"nodes": [], "edges": []}, "Z1": {"nodes": [], "edges": []}, "Z2": {"nodes": [], "edges": []}}}
  },
  "sources": {}
}
```

Every diagram node uses:

```json
{
  "id": "stable semantic id shared across bands/views when meaning is the same",
  "parentId": null,
  "label": "string",
  "purpose": "string",
  "kind": "capability|operation|decision|event|external-boundary|analysis-gap",
  "bounds": {"x": 0, "y": 0, "width": 100, "height": 60},
  "summaryOf": ["child semantic ids"],
  "input": "string or empty",
  "output": "string or empty",
  "evidence": [{"path": "relative/path", "startLine": 1, "endLine": 1}]
}
```

Every edge uses `id`, `source`, `target`, `kind: control|data|event`, nonempty `label`, nullable `condition`, nullable `result`, `summaryOf`, and evidence. Child bounds are relative to their stable parent. An object that persists across bands keeps the same ID and compatible parent bounds.

The prompt requires a complete authentication overview, sign-up/sign-in sub-capabilities, sign-in success and both failure paths, sign-up email and event dispatch, actual data crossing boundaries, and explicit gaps/external boundaries. It forbids invented session/cache behavior, claims based only on `TODO` comments, and reading the old prototype model.

- [ ] **Step 3: Generate one model pass**

Ask the current coding agent:

```text
Read experiments/semantic-zoom-feasibility/AI_PROMPT.md and evidence.json.
Write only experiments/semantic-zoom-feasibility/model.json.
Do not read prototype/src/model.js or prior generated models.
```

- [ ] **Step 4: Validate evidence, hierarchy, aggregation, and stable bounds**

Implement `validate.mjs` with `node:assert/strict`. It must reject:

- missing `Z0`, `Z1`, or `Z2` in either diagram;
- a feature, node, or edge without valid evidence in the selected source;
- duplicate IDs inside a band or dangling edges;
- a child whose `parentId` does not exist in the same or preceding band;
- an aggregate `summaryOf` ID that never appears in a higher band;
- an object shared across bands whose parent changes;
- `Z0` with more than 30 nodes or 50 edges in either diagram;
- missing sign-in success/failure alternatives, missing sign-up event path, or an empty data/event edge label.

On success, write `{model, sources: evidence.sources}` to `prototype/src/generated/semantic-zoom-model.json`.

Run: `node experiments/semantic-zoom-feasibility/validate.mjs`

Expected: exit `0`; both diagrams contain three valid bands and the browser artifact is generated.

### Task 2: Build The Minimal Native SVG Semantic-Zoom Canvas

**Files:**
- Create: `prototype/src/semantic-zoom/useSemanticCamera.js`
- Create: `prototype/src/semantic-zoom/SemanticCanvas.jsx`
- Create: `prototype/src/semantic-zoom/semanticZoom.css`
- Create: `prototype/src/semantic-zoom/camera.selftest.mjs`

- [ ] **Step 1: Write one camera self-check first**

Export pure helpers `clampScale`, `bandForScale`, and `zoomAroundPoint`. The self-check uses `node:assert/strict`:

```js
assert.equal(bandForScale(0.8, "Z0"), "Z0");
assert.equal(bandForScale(1.7, "Z0"), "Z1");
assert.equal(bandForScale(3.2, "Z1"), "Z2");
const before = screenToWorld({x: 400, y: 300}, {x: 20, y: 30, scale: 1});
const camera = zoomAroundPoint({x: 20, y: 30, scale: 1}, {x: 400, y: 300}, 2);
assert.deepEqual(screenToWorld({x: 400, y: 300}, camera), before);
```

Use thresholds with hysteresis: enter `Z1` at `1.5`, return to `Z0` below `1.3`; enter `Z2` at `2.8`, return to `Z1` below `2.5`. Clamp scale to `0.5..4`. Export `canonicalScaleForBand` with `Z0: 1`, `Z1: 1.7`, and `Z2: 3.2`.

Run: `node prototype/src/semantic-zoom/camera.selftest.mjs`

Expected before implementation: module-not-found or missing-export failure.

- [ ] **Step 2: Implement the camera hook with browser-native events**

`useSemanticCamera` owns `{x, y, scale, band}`.

- `wheel`: call `preventDefault`, multiply scale by `Math.exp(-deltaY * 0.0015)`, and preserve the world point under the pointer.
- `pointerdown`: begin pan only for `event.button === 1`; call `setPointerCapture`.
- `pointermove`: while middle-button panning, change only `x/y`.
- `pointerup`/`pointercancel`: stop pan and release capture.

The hook exposes `camera`, `bind`, and `setSemanticBand`. `setSemanticBand` chooses this window's canonical scale for the received band and zooms around this window's viewport center; it never accepts or copies another window's `x`, `y`, or scale. Panning must never change `band`.

- [ ] **Step 3: Render one band at a time in native SVG**

`SemanticCanvas` accepts `{diagram, selectedId, onSelect, onOpenSource}`. It renders only `diagram.bands[camera.band]`, not all bands with CSS visibility. Use one SVG `<g transform="translate(x y) scale(scale)">` for the global camera.

Render stable parent regions first, edges second, nodes third. Nodes use `<g role="button" tabIndex="0">`; clicking selects, while a small source icon/button calls `onOpenSource`. Edges and their labels are also selectable and open their own evidence. Use `aria-label` with label and purpose. Edge labels show what crosses the relation; decision edges include condition/result.

Display the current band (`概览`, `领域`, `机制/实现`) and scale as a small noninteractive status in the canvas corner. Do not add zoom buttons, minimap, node dragging, connection editing, search, or layout controls.

- [ ] **Step 4: Add transition and interaction styling**

CSS gives nodes and edges at most `160ms` opacity transitions when the band changes. Middle-button panning uses `cursor: grabbing`; normal canvas uses `cursor: default`. Selected semantic IDs use one clear outline. Text remains upright because it lives inside the scaled world; hide labels in the data model by band rather than counter-scaling fonts.

- [ ] **Step 5: Run the self-check and existing build**

Run:

```bash
node prototype/src/semantic-zoom/camera.selftest.mjs
cd prototype && npm run build
```

Expected: camera checks pass and the existing prototype build remains successful.

### Task 3: Add Feature Tree, Two Independent Canvases, Sync, And Source Drawer

**Files:**
- Create: `prototype/semantic-zoom.html`
- Create: `prototype/src/semantic-zoom/main.jsx`
- Create: `prototype/src/semantic-zoom/SemanticZoomApp.jsx`
- Create: `prototype/src/semantic-zoom/FeatureTree.jsx`
- Create: `prototype/src/semantic-zoom/SourceDrawer.jsx`
- Modify: `prototype/vite.config.js`

- [ ] **Step 1: Create a separate Vite entry**

```html
<!doctype html>
<html lang="zh-CN">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Code Synapse 语义缩放验证</title></head>
  <body><div id="root"></div><script type="module" src="/src/semantic-zoom/main.jsx"></script></body>
</html>
```

Add both HTML entries to Vite so `npm run build` validates the experiment:

```js
import {resolve} from "node:path";
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        prototype: resolve(import.meta.dirname, "index.html"),
        semanticZoom: resolve(import.meta.dirname, "semantic-zoom.html"),
      },
    },
  },
});
```

- [ ] **Step 2: Route by view without tabs**

`SemanticZoomApp` reads `view=features|capability|behavior`. The feature page is a tree. Capability and behavior each render `SemanticCanvas` in their own page/window. Provide icon/text links that call `window.open(url, "code-synapse-capability")` or `window.open(url, "code-synapse-behavior")`; no in-page diagram tabs.

- [ ] **Step 3: Synchronize semantic identity and detail band**

Use one `BroadcastChannel("code-synapse-semantic-zoom-poc")`. Broadcast:

```js
{type: "selection", semanticId, sourceView}
{type: "band", band, sourceView}
```

Selection in one canvas highlights the same ID or its nearest visible ancestor in the other. Find the ancestor by following `parentId` until an ID exists in the active band. A received band calls `setSemanticBand` locally, so it changes the representation without copying the other canvas's pan/scale coordinates. Feature selection opens/focuses the behavior view and broadcasts its `targetId`.

- [ ] **Step 4: Open source beside the active canvas**

`SourceDrawer` accepts the selected visual object and generated source arrays. It displays purpose, input/output, edge condition/result where applicable, each cited repository-relative path, exact original line numbers, and source text in a `<pre>`. It occupies a responsive side column; closing it restores canvas width without resetting camera, band, or selection.

- [ ] **Step 5: Build and run the validation page**

Run:

```bash
cd prototype
npm run build
npm run dev -- --port 4173
```

Open: `http://127.0.0.1:4173/semantic-zoom.html?view=features`

Expected: feature tree opens the named behavior window; capability and behavior open as separate pages; wheel transitions `Z0 -> Z1 -> Z2`; middle-button pan leaves band unchanged; selection synchronizes; source drawer shows exact evidence; no React Flow asset or old hard-coded model is imported by the new entry.

### Task 4: Run The Phase 0 Comprehension And Interaction Gate

**Files:**
- Create: `experiments/semantic-zoom-feasibility/review.md`
- Modify: `docs/design/product.md` only after recording the measured result
- Modify: `docs/design/visual-model.md` only after recording the measured result

- [ ] **Step 1: Record technical truth and size measurements**

In `review.md`, record:

```text
AI passes used:
evidence bytes:
generated model bytes:
Z0/Z1/Z2 node and edge counts per diagram:
unsupported claims:
missing critical behavior:
wrong conditions/results/transfers:
manual topology corrections:
```

Technical pass requires zero unsupported claims, zero missing critical sign-up/sign-in/event behavior, zero wrong conditions/results/transfers, and zero manual topology corrections.

- [ ] **Step 2: Verify the confirmed interaction model**

The user performs these checks:

1. At `Z0`, explain the complete authentication capability collaboration and top-level behavior without reading source.
2. Zoom both canvases to `Z1` and `Z2`; identify what detail appeared and confirm the parent regions did not move incoherently.
3. Pan with the middle button across the canvas and confirm no semantic band or selected object changed.
4. Select the same semantic object in both canvases and confirm synchronization without copied pan coordinates.
5. Open and close source evidence and confirm the camera, band, and selection remain unchanged.
6. Zoom out and confirm a selected hidden descendant is represented by its visible ancestor.

- [ ] **Step 3: Compare against the rejected click-to-drill prototype**

The user answers whether semantic zoom makes these tasks easier, equal, or harder than separate child-page navigation:

- retaining where a detail belongs in the global process;
- moving between overview and implementation;
- comparing two nearby capabilities or branches;
- understanding what data/event crosses a relationship.

Pass requires no task rated harder and at least three rated easier.

- [ ] **Step 4: Apply the decision rule**

- `GO`: truth checks pass, all interaction checks work, and comprehension comparison passes. Next, validate one additional diagram grammar and a simulated region loader before production architecture.
- `REVISE`: source/semantic evidence is sufficient but zoom bands, stable layout, synchronization, or drawer interaction is confusing. Revise only the failing interaction/model layer and repeat Phase 0.
- `STOP`: stable semantic zoom cannot preserve meaning or context for this bounded sample. Reconsider the navigation model before any diagram engine work.

Record the outcome in the canonical design. Do not implement all diagram types or real large-project chunking from a single successful sample.
