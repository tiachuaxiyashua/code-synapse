# Code Synapse Product Decisions

This is the canonical local memory for the project. It records confirmed requirements, rejected approaches, and unresolved design questions. Update it whenever a product decision changes.

## Origin Of The Problem

AI can produce large amounts of complex code faster than a beginner can review or learn it. Reading every line is not practical, and people entering AI coding often lack the implicit knowledge that experienced programmers take for granted: architecture, frameworks, terminology, conventions, common patterns, control flow, data flow, and the reasons behind implementation choices.

Existing code-graph tools such as GitNexus and CodeGraph are useful structural analyzers, but their dense relationship networks are not acceptable as the primary human interface. They show too many connections at once, do not explain functional purpose, and do not support progressive human understanding.

Ad-hoc AI explanations are also insufficient because language compresses the codebase, cannot explain everything at once, and is difficult to navigate consistently across abstraction levels. Code Synapse therefore needs persistent, navigable, evidence-backed models rather than one-off chat explanations.

## Product Goal

Code Synapse helps people with limited programming knowledge understand an existing codebase until they can reason about it as confidently as code they wrote themselves.

The product must support:

- A global understanding of the codebase and its software structure.
- Progressive drill-down from capabilities and high-level flows to modules, functions, statements, data, and evidence.
- Fast location of logic relevant to a user or an AI coding agent.
- Explanations of what code does, why it exists, how it works, what it exchanges, and what assumptions it relies on.
- Change understanding: what logic was added or changed, how it is implemented, what it is useful for, and whether it conflicts with existing behavior.
- Understanding of parameters, returned values, shared state, messages, streams, pointers, arrays, dictionaries, interfaces, protocols, and other data exchanged between steps.
- Explanations of programmer terminology, framework conventions, architectural patterns, and implicit assumptions in language appropriate for the selected target audience.
- A path from a high-level capability to the smallest useful implementation unit without losing the current context.

## Target Users And Scope

- First target: non-programmers and weak programmers entering AI coding.
- Product rollout order from the earlier option labels is B first, then A; C is not part of the initial plan. B is the confirmed non-programmer/weak-programmer audience. The exact definition of A must be recovered or revalidated before implementing the second audience mode.
- The architecture may leave room for expert users later, but expert-focused features are not part of the first version.
- The analysis architecture is multi-language from the start.
- Initial source-language support: TypeScript, JavaScript, and Python.
- Planned follow-on source languages include C, C++, C#, and GDScript. Adding them must not require changing the canonical graph model or rebuilding the product around a language-specific architecture.
- Target repositories include mobile applications, websites and services, embedded and real-time systems, operating-system or other low-level code, automation scripts, and game projects. Project type changes which analyzers and mechanism detectors run; it does not change the product's core evidence model.
- The first usable surface is a local web application, not a heavy desktop UI.
- The product is not an audio tool. Audio is a reference scenario used to stress timing, concurrency, streams, and nested flows.

## End-To-End Product Architecture

The solution is a pipeline, not a collection of diagram patches:

1. **Acquire structural facts.** In the current phase, invoke CodeGraph CLI to build or synchronize `.codegraph/codegraph.db`, then read that SQLite database directly and read-only through a version-gated adapter. Additional analyzers are deferred.
2. **Normalize facts.** Convert language-specific results into a common evidence model without pretending that all languages or paradigms behave the same.
3. **Enrich semantics.** Use annotations and bounded AI passes to add purpose, feature ownership, human terminology, mechanism hypotheses, and explanations.
4. **Build hierarchical scopes.** Derive capability, feature, module, operation, function, and terminal implementation scopes with explicit parent-child relationships.
5. **Select projections.** Route each scope to the notation and renderer that fits its detected mechanism. Each diagram type uses a separate synchronized canvas and applies global semantic zoom within that grammar.
6. **Persist artifacts.** Store facts, inferences, evidence, explanations, projections, and versions under `.code_synapse/`.
7. **Serve independent views.** The feature tree and separate diagram pages read the same model and synchronize semantic selection, scenario/configuration, Diff selection, and detail band. Source evidence opens in a drawer adjacent to the active canvas.
8. **Update incrementally.** Use Git diffs, symbol impact, annotations, and cached evidence to rebuild only affected artifacts.

## Development Validation Order

The first development phase is a disposable end-to-end feasibility experiment, not the production foundation. It must test the riskiest product claim before general infrastructure is built:

```text
real CodeGraph evidence and source
-> bounded AI semantic graph
-> feature tree and capability collaboration
-> globally zoomable capability and behavior canvases
-> conditions, data transfers, and adjacent source evidence
-> beginner review in the web prototype
```

The experiment reuses one existing real TypeScript sample that contains request handling, nested calls, branches, dependency injection, configuration, and event dispatch. It may use fixed scope selection, existing `sqlite3`, inspectable JSON, the current AI coding agent, and the disposable React prototype. Those shortcuts are intentional because the experiment measures product-model feasibility, not parser completeness, performance, packaging, or provider architecture.

The feasibility gate passes only when:

- every displayed functional claim links to exact source or CodeGraph evidence;
- a user can start from the feature tree or capability overview, understand the main behavior, use wheel zoom to reveal at least two semantic detail levels without page navigation, pan with the middle mouse button without changing detail state, and open implementation evidence in the adjacent drawer;
- branch conditions, alternative results, parameters/returns or event payloads, and analysis gaps are visible without exposing a dense repository graph;
- the user can correctly answer the experiment's comprehension questions without reading the source first;
- semantic correction is small enough to be practical: no invented behavior, no missing main path, and no manual reconstruction of the graph by a programmer.

Failure means revise or reject the semantic model, AI evidence contract, or interaction hierarchy before building the foundation. Passing this single TypeScript experiment authorizes only the next narrow production slice. It does not prove Python support, arbitrary frameworks, specialized timing/dataflow projections, or large-repository scalability.

## Canonical Human And Evidence Model

The primary model presented to a beginner is:

```text
Capability
-> Use case
-> Scenario
-> Behavior step
-> Selection condition and result
-> Implementation evidence
```

The hierarchy is navigable in both directions. A feature tree locates functions and use cases; selecting one centers the corresponding semantic region in the capability or behavior canvas. Wheel semantic zoom reveals that region's nested scopes in place. Scenarios are readable paths through the complete symbolic behavior graph, not a replacement for that graph.

The shared model needs universal fallback primitives even when no specialized mechanism is recognized:

- Entity or symbol.
- Containment and parent-child scope.
- Operation or step.
- Control transfer and call.
- Data transfer and data contract.
- Execution context such as process, thread, task, actor, worker, interrupt, or event loop.
- Causality and trigger.
- Time event, timestamp, duration, deadline, and clock domain.
- State read, state write, and side effect.
- Evidence source and source range.
- Symbolic predicate, selector, branch, and result.
- Binding source and currently selected branch.
- Status: `declared`, `condition`, `selector`, `selected`, `observed`, `analysis-gap`, or `external-boundary`.

Specialized mechanism models extend these primitives; they do not replace the common evidence layer.

These statuses have precise meanings:

- `declared`: the code declares this behavior, path, target candidate, or transfer.
- `condition`: the code declares a symbolic predicate that guards behavior.
- `selector`: a configuration value, input, state value, event, platform/build choice, or runtime value supplies a predicate operand.
- `selected`: current bindings make this branch active. This highlights a declared branch; it does not create the branch.
- `observed`: a specific runtime execution traversed the branch.
- `analysis-gap`: the relevant implementation is in the repository, but Code Synapse failed to recover it. This is a tool deficiency with actionable evidence, not program uncertainty.
- `external-boundary`: the repository deliberately delegates behavior to code, data, hardware, or a service outside the imported boundary.

Provider confidence, heuristic resolution scores, and AI confidence may be retained as internal evidence metadata. They must not turn program alternatives into a vague user-facing probability about how the program works.

## Analysis And Graph Construction

- Use only `colbymchenry/codegraph` as the external structural graph in the current implementation phase. CodeWiki and Understand Anything are not current providers, optional runtimes, adapter targets, or roadmap work.
- No external repository is the whole-product code foundation. Code Synapse owns its canonical model, persisted `.code_synapse/` artifacts, enrichment pipeline, feature and mechanism scopes, projections, change model, and independent-view architecture.
- CodeGraph CLI is responsible only for `init`, `sync`, `status`, and rebuild operations. Code Synapse does not add a persistent CodeGraph provider process in the first version.
- Code Synapse reads `.codegraph/codegraph.db` directly after CodeGraph finishes writing. Do not parse `codegraph_explore` or other summarized text to ingest facts, and do not export the entire graph to JSON in the normal product path.
- Only the CodeGraph SQLite adapter knows upstream tables and columns. It uses read-only, prepared, paged queries; validates schema/extraction/index versions and errors; preserves provider IDs, call sites, provenance, confidence, resolution method, original reference text, and unresolved references; and fails closed on unknown schemas.
- The CodeGraph database is a rebuildable structural cache, not the Code Synapse semantic model. Browser pages, AI prompts, Skills, renderers, and semantic files never query its tables directly.
- Code Synapse stable identities are derived from language, repository-relative path, symbol kind, qualified name, and signature. Raw CodeGraph IDs remain diagnostic provider references and cannot leak into durable feature, flow, architecture, runtime, or code-detail contracts.
- Normalize analyzer output into a language-neutral model of entities, relations, execution contexts, data transfers, symbolic behavior, selector bindings, and evidence.
- Use AI only for higher-level semantics that static analysis does not reliably provide: purpose, feature ownership, feature hierarchy, feature chains, mechanism hints, and human explanations.
- Multiple AI passes are allowed. Their results must be persisted as versioned files rather than trapped in a conversation.
- Comments and annotations are stable hints, not the truth source. Cross-check them against ASTs, types, imports, call relations, tests, and runtime evidence.
- Dynamic dispatch and runtime selection remain explicit selector-driven behavior where the repository declares their choices. Anything Code Synapse cannot recover is classified as `analysis-gap` or `external-boundary`; never fabricate a complete mechanism.
- Mechanism detection is evidence-based, scoped, non-exclusive, and allowed to fail.

### Control Flow And Branches

- CodeGraph supplies symbols and cross-symbol relations; Code Synapse owns deterministic function-local control-flow extraction for TypeScript, JavaScript, and Python.
- Extract decisions and predicates, branch membership, switch/match cases, loops, early returns, exceptions, try/catch/finally, calls, awaits, explicit parallel/join constructs, and recursion links with exact source evidence where the language exposes them.
- A source branch is program behavior, not uncertainty. Static flow must show every discovered path and the condition that activates it, regardless of which path a particular execution later takes.
- Attach each CodeGraph call site to its exact control-flow position. A call directly present inside a known branch is deterministically a member of that branch. Resolve target alternatives from types, registrations, assignments, configuration, and framework rules; retain the CodeGraph resolution record only as provider evidence.
- Do not promote every `if` to the feature tree. Classify branches as feature variants, flow branches, or implementation guards. AI may propose the semantic class with evidence; it cannot delete or invent the deterministic branch.
- Compose function-local flows into bounded hierarchical scopes. Composite calls reference child scopes that semantic zoom reveals inside stable parent regions instead of recursively inlining the repository. Recursion uses a recurrence edge and base/termination evidence rather than infinite expansion.

### Symbolic Behavior, Selectors, And Configuration

- Static analysis builds the complete symbolic behavior space declared by the repository: every recovered branch, predicate, target alternative, result, and implementation link.
- A selector is any value that decides a predicate: configuration, command-line argument, environment variable, request or function input, stored state, event payload, feature flag, platform/build choice, dependency-injection registration, or runtime type.
- A missing configuration file does not remove a path and does not make the behavior uncertain. The selector remains unbound, and all code-declared alternatives remain visible with their conditions and results.
- Code Synapse infers configuration requirements from reads in source code, schemas, defaults, manifests, examples, tests, and registration APIs. It performs bounded data propagation from each read through aliases and derived values into predicates and selected targets.
- When a project configuration, selected profile, current environment snapshot, or user-supplied value is available, Code Synapse binds the selector and highlights the selected branch. It never deletes the other declared branches.
- Store predicates symbolically and materialize a scenario only when the user or an AI asks for a use case, binding set, or result. Do not pre-generate the Cartesian product of all selector values.
- Direct SQLite reading preserves CodeGraph's raw structural evidence without transport loss. Code Synapse must still interpret source predicates, data propagation, registrations, and external boundaries before producing the human behavior model.

For example:

```ts
const mode = config.get("MODE");
const fast = mode === "fast";

if (fast) runFast();
else runSafe();
```

is stored as the complete declared choice even when no configuration file exists:

```json
{
  "selector": "MODE",
  "branches": [
    {"condition": "value == 'fast'", "result": "fast mode"},
    {"condition": "value != 'fast'", "result": "safe mode"}
  ],
  "activeValue": null,
  "activeBranch": null
}
```

If the active configuration later supplies `MODE=fast`, only `activeValue` and `activeBranch` change; the symbolic branches do not.

### Mechanism Recognition Evidence

Mechanism detectors may use:

- AST structure, imports, calls, types, inheritance, decorators, annotations, and language constructs.
- Framework registration APIs, routing tables, dependency injection, event-handler registration, middleware, message schemas, and configuration files.
- Concurrency primitives, queues, channels, buffers, callbacks, async tasks, processes, threads, interrupts, and schedulers.
- Tests, fixtures, naming, documentation, stable Code Synapse annotations, and AI suggestions.
- Runtime traces, logs, spans, message metadata, performance counters, and hardware timing evidence.

Each detector emits a scoped hypothesis with supporting and contradicting evidence. Multiple mechanisms may apply to the same code. Dynamic registration, reflection, generated code, and monkey-patching are represented through their declared selectors and targets. A missing internal result is `analysis-gap`; a native, generated, service, hardware, or other out-of-repository implementation is `external-boundary`.

### Analyzer Provider Architecture

Language support is a capability bundle rather than a file-extension switch. The analysis layer must accept independently versioned providers for:

- Syntax and structure: Tree-sitter, native ASTs, and source maps.
- Semantic resolution: language servers, compiler indexes, type systems, symbol databases, and generated-code metadata.
- Build and configuration: manifests, compilation databases, build graphs, conditional compilation, linker configuration, deployment descriptors, and project settings.
- Framework and platform mechanisms: routes, lifecycle callbacks, dependency injection, signals/events, schedulers, tasks, interrupts, IPC, serialization, and framework registration.
- Runtime evidence: traces, logs, spans, counters, profiles, hardware events, and debugger exports.
- AI and annotations: bounded semantic enrichment and stable Code Synapse hints.

Each provider declares the languages, file kinds, project profiles, fact kinds, evidence guarantees, and unavailable capabilities it supports. A project may combine providers. An unavailable capability is reported as an `analysis-gap` until a suitable provider is installed; it is not confused with a code-declared alternative.

Adding a source language requires, as applicable: detection rules, grammar or native parser integration, symbol and call extraction, import/include/reference resolution, build-system integration, framework/platform detectors, representative fixtures, and resolution/evidence tests. A grammar alone does not count as useful language support.

Planned native integrations include compilation-database and Clang-family evidence for C/C++, Roslyn/MSBuild evidence for C#, and Godot project metadata, signals, lifecycle callbacks, resources/scenes, and language-server evidence for GDScript. Tree-sitter remains the deterministic fallback when richer tools are unavailable.

### Structural Provider Experiment Evidence

The reproducible experiment under `experiments/graph-foundation/` compared fixed commits of CodeGraph, CodeWiki, and Understand Anything across TypeScript/JavaScript, Python, FreeRTOS C, embedded C++, ASP.NET C#, and Godot GDScript. This section records observed constraints; no upstream schema becomes the Code Synapse schema.

- CodeGraph is the selected first structural provider. Excluding unsupported GDScript, it matched 24/24 declared symbols and 24/24 declared call expressions, preserved all 24 call-site lines, and resolved 18/24 calls to target entities. CodeWiki matched 21/24 symbols, 20/24 calls, no exact call-site lines in its Lite graph edges, and resolved 9/24; Understand Anything matched 15/24 symbols, observed 24/24 calls with locations, and resolved 0/24.
- In the controlled TypeScript edit, CodeGraph reported and synchronized exactly one modified file in 0.401s. The new method and call were present, and the 148-node/205-edge incremental graph matched a clean rebuild at every compared node and edge identity. This makes its incremental index acceptable as the first provider cache, while Code Synapse still owns version validation and full-rebuild fallback.
- CodeGraph preserves edge call sites, `tree-sitter`/`scip`/`heuristic` provenance, resolution confidence/method/original reference, and unresolved references. The product path directly reads its SQLite file through the pinned schema adapter after CLI `init/sync`; Library API embedding and a persistent provider process are not part of the first version.
- CodeGraph's GDScript run returned exit code zero while printing that all indexed files failed and emitting no structural facts. Provider success checks must inspect facts, status, and errors rather than process exit alone.
- CodeGraph's ETL C++ cache was approximately 188 MB and its JSON export approximately 153 MB. Use bounded queries or streaming normalization; never send or persist the whole supplier graph when only an affected scope is needed.
- The pinned CodeGraph dependency tree resolved `picomatch 4.0.3`, which has a fixable high-severity ReDoS advisory. Product integration requires a 4.0.4-or-newer override/pin and dependency-audit gate. Direct Library embedding also requires Node.js 22.5 or newer; the standalone CLI can isolate its bundled runtime.
- CodeWiki 0.6.5's open `tree-sitter>=0.23` dependency resolved to 0.26.0 and produced reproducible signal crashes on the Python, C, C++, and C# samples. Its repository lock uses 0.25.2, which passed the same single-file reproducer and all six final runs. This is retained only as historical comparison evidence; no CodeWiki adapter is planned.
- CodeWiki's incremental updater is not currently trusted as the canonical invalidation mechanism. In the controlled one-file experiment it perpetually classified nine existing config files as new and reduced graph edges from 242 to 191 after sync. Code Synapse must own version comparison, validation, and full-rebuild fallback.
- Understand Anything's deterministic extractor was substantially faster and preserved exact call-expression lines, but emitted unresolved caller/callee text rather than target-linked call edges and did not attach confidence/evidence semantics comparable to CodeWiki. This remains historical experiment evidence only; Understand Anything is not a current provider or roadmap item.
- None of the three providers extracted GDScript symbols or calls. Godot support requires a dedicated provider using Godot project, scene, signal, lifecycle, resource, and language-server evidence.
- CodeGraph materially improved the declared C/C++ truth results, but Tree-sitter and heuristic resolution still do not model compilation databases, preprocessing, templates, build variants, or full type semantics. Its C++ comparison produced 38 non-overlapping entity ranges against CodeWiki and 2 against Understand Anything. Compilation database and Clang-family evidence remain required.
- The historical multi-provider experiment showed why a blind union would be unsafe. The current single-CodeGraph product still preserves provider identity, source range, raw resolution status, confidence, candidate sets, and contradictions as internal evidence. Canonical identity includes signature/range and provider provenance so legitimate overloads do not collapse. The human behavior model converts those records into declared alternatives, selector conditions, `analysis-gap`, or `external-boundary`.

Full measurements, raw failures, normalized facts, and the recommendation are in `experiments/graph-foundation/results/REPORT.md`.

## AI And CLI Integration

- The project should be usable by Codex and Claude Code as a plugin or Skill without requiring the user to run every step manually.
- A CLI must also support manual analysis, incremental updates, and serving the local web pages.
- Users provide their own AI provider and API credentials when an external model is required.
- `code_synapse-author` Skill: while AI writes or changes code, write minimal stable semantic annotations and update affected graph artifacts.
- `code_synapse-bootstrap` Skill: for existing unannotated code, propose or add missing semantic annotations and sidecar metadata.
- Prefer incremental rebuilding from Git diffs and affected symbols to reduce token cost.
- The authoring Skill should use language-appropriate structured comments for stable semantics such as feature, purpose, inputs, outputs, triggers, side effects, and invariants.
- Generated files, vendor code, or code that should not be modified may use sidecar annotations instead of source comments.
- The bootstrap Skill must show proposed annotations and evidence before applying them when confidence is not high.

### Token And Maintenance Strategy

- AI reads bounded SQLite-adapter graph slices, exact source ranges, deterministic control-flow facts, and affected scopes instead of repeatedly rereading the whole repository.
- Stable semantic annotations are reused across rebuilds.
- Deterministic facts and projections are generated in code without AI.
- AI outputs are cached with source version, prompt/schema version, evidence references, and confidence.
- Git diff and impact analysis limit regeneration to changed symbols and affected parent features.
- Users can rebuild a scope, a feature, or the whole project explicitly.

## Persisted Artifacts

- Code Synapse-owned graph, control-flow, semantic, and explanation output must be stored in a versionable `.code_synapse/` directory. Do not duplicate the entire CodeGraph structural database there.
- Expected artifact categories include manifest, stable identity mappings, control-flow facts, evidence references, feature hierarchy, flows, explanations, architecture projections, runtime traces, changes, and view metadata.
- Codex, Claude Code, the CLI, and the web UI must consume the same persisted model.
- Code Synapse semantic artifacts must be inspectable files rather than an opaque database-only cache. The upstream `.codegraph` SQLite file remains the directly queried, rebuildable structural cache.
- The model needs schema versions and migration support because it will outlive individual UI implementations.
- Relationships and explanations must link back to exact source evidence where available.

## Independent Synchronized Canvases

- Diagram types are independent web pages/windows with separate coordinate systems. They are not tabs and are never overlaid into one universal canvas.
- Each diagram page contains one logical infinite canvas. The wheel performs global semantic zoom; holding the middle mouse button pans without changing semantic state.
- Different diagram pages synchronize semantic selection, scenario/configuration, Diff selection, and compatible detail bands. They do not synchronize screen coordinates.
- Default window behavior reuses and focuses one named window per view type. The optional always-new-window preference applies when opening another diagram view, not while zooming into detail.
- Users choose which independent views to open and place side by side. Closing one view does not disable the others.
- A pinned view may keep its current location instead of following a selection broadcast.
- The final product needs a small window launcher or command surface, but not a project landing page or diagram tabs.

## View Set

### Feature Tree

- Keep a feature tree for locating user-visible functions and use cases. Capabilities are not represented by this tree; they belong to the capability collaboration graph.
- Remove the separate feature-chain presentation. Selecting a feature locates its corresponding capability or behavior region.
- The feature tree is not a project landing page and does not duplicate flow content.
- Selecting a feature locates and centers its corresponding semantic region in an already open capability or behavior canvas, or opens that diagram view according to the window preference.
- Each feature node shows its human purpose and implementation coverage, but detailed execution belongs to the flow page.

### Capability Collaboration

- The capability collaboration page is the default global product diagram.
- It shows major capabilities and how they collaborate to deliver the system purpose.
- Every relationship states what crosses it: data, event, state, control, resource, or timing obligation, plus why the collaboration exists.
- Global semantic zoom reveals sub-capabilities, use-case participation, owning modules, and implementation evidence within stable parent regions.
- A low-detail aggregate relationship splits into constituent relationships at higher detail without changing meaning.

### Flow

- The flow page is an independent page.
- The complete top-level behavior remains spatially stable while wheel zoom progressively reveals child processes and implementation groups inside their parent regions.
- A composite node that indicates more detail must have real child content available at a higher semantic zoom band. Clicking is not required to navigate to a child page.
- Continue semantic zoom until the model reaches terminal implementation groups.
- A terminal node must clearly indicate that it cannot be decomposed further.
- Large flows use summary nodes and aggregated relationships at low detail; child detail is not loaded or rendered until its band and region become visible.
- Recursion is represented as a recursive call or loop marker with a link back to the repeated scope, not by infinitely expanding nodes.
- A large flow may contain collapsed subprocesses, subflows, compound nodes, loops, branches, parallel regions, retries, and exception paths.
- Cross-scope edges must preserve what crosses the boundary: typed value, message, stream, state transition, interface, timing relation, or control transfer.
- Parent and child content keep stable identities, relative coordinates, and anchors so zooming in/out does not lose context.
- A node cannot advertise deeper detail unless a higher-band projection or terminal evidence exists.

### Software Architecture

- The architecture page is an independent page and must never contain runtime flow, execution order, or business-process notation.
- Use the C4 model, preferably Structurizr semantics and compatible open-source rendering, for System, Container, and Component levels.
- Show static component responsibility, boundaries, dependency direction, interface/protocol/type labels, and evidence.
- Software layers may be represented as C4 boundaries or tags, but static relationships must not be presented as execution order.
- Users can enter a lower C4 level or locate the selected component in another independent view.
- Layer rules include allowed dependency directions, provided/required interfaces, forbidden references, and violations with evidence.
- Architecture relations are static dependencies. Their arrows must never imply runtime order.

### Runtime And Timing

- Runtime timing is an independent page.
- Use Perfetto-style tracks, slices, counters, flow arrows, clocks, and deadlines for software execution traces.
- Use WaveDrom-style timing diagrams for hardware signals and strict digital timing.
- Do not use decorative pseudo-timelines or disconnected boxes to represent timing.
- Runtime views need continuous axes, multiple execution tracks, cross-track causal links, clock identity, relative and absolute timestamps, counters, and deadline markers where evidence exists.
- Strict hardware timing must identify clock domains, interrupts, edges, cycles, and offsets from a reference such as `t0`.

### Code Detail

- Code detail is an editor-style drawer beside the active canvas, not a diagram and not normally a separate page.
- It shows source, purpose, inputs, outputs, side effects, callers, callees, evidence, selector bindings, exceptions, analysis gaps, external boundaries, and relevant changes.
- Terminal implementation groups may link to exact lines, but the model should explain statements in meaningful groups rather than forcing beginners to interpret every token without context.

### Change And Conflict Understanding

- The user must be able to compare graph/model versions before and after an AI code change.
- A change explanation includes added, removed, and modified behavior; affected features and flows; interface or data-contract changes; new side effects; changed timing; and impacted callers/consumers.
- Potential conflicts include contradictory feature behavior, duplicate responsibility, incompatible contracts, invalid dependency direction, competing event handlers, ordering changes, timing/deadline risk, and annotation/evidence disagreement.
- Change visualization is an optional overlay on every existing diagram. Selecting base and target commits highlights added, modified, and removed semantic objects/relationships in their existing positions; no Diff selection means no change decoration.
- Every conflict or risk links to evidence and an evidence class. The product must distinguish a proven incompatibility from an AI-proposed warning without asking beginners to interpret a numeric confidence score.

## Diagram Standards And Renderers

Do not force all mechanisms into one universal diagram grammar. The complete inventory, semantic zoom rules, loading model, Diff overlay, and source drawer are canonical in `docs/design/visual-model.md`. Select renderer families by evidence:

- Software architecture: C4 / Structurizr; C4-PlantUML is acceptable for interchange or fallback rendering.
- Business and orchestration processes: BPMN 2.0 with `bpmn-js` where the model fits BPMN semantics.
- Calls and request/response interactions: UML sequence diagrams through a mature renderer such as PlantUML.
- Typed dataflow, streaming, DSP, and concurrent channels: port-based compound graphs laid out with ELK; use domain conventions similar to GNU Radio or synchronous dataflow tools.
- Event-driven systems: event topology for producers, brokers, topics, consumers, retries, and dead letters; use a sequence projection for one causal event path.
- Runtime traces: Perfetto-compatible trace data and UI conventions.
- Hardware timing: WaveDrom-compatible timing data and rendering.
- Nested general processes: BPMN embedded subprocess semantics where BPMN applies.
- Reusable collapsed flows: Node-RED subflow-style separate scopes and explicit ports where appropriate.
- Hierarchical port layout: ELK Layered compound graphs and cross-hierarchy edges.
- Aggregate runtime cost: flame graph or icicle projection where stack-sampling or span aggregation is available.
- General trace exploration may reuse concepts or integrations from Trace Compass when Perfetto is not the right trace format.

The exact projection router and renderer integrations remain open for further visual validation. No single generic node canvas is the default renderer for every diagram.

## Explanation Language

- The explanation language is selected once when a project is imported.
- Generate one set of AI explanations and graph labels in the selected language. Do not pre-generate multiple languages or switch languages at runtime.
- Source identifiers remain unchanged: function names, class names, variable names, API names, event names, types, file paths, and source code.
- UI explanations, feature names, purpose text, relationship descriptions, evidence summaries, and rules use the selected project language.
- Changing the explanation language later is an explicit regeneration operation with a clear AI-cost warning.
- The selected explanation language is persisted in the project manifest and used by the bootstrap and authoring Skills.

## Hover, Pin, And Detail Interaction

- Hovering a flow, module, function, interface, or relevant edge displays a concise explanation popover.
- The popover follows the pointer near the hovered item instead of appearing in a distant fixed inspector.
- Apply viewport collision detection so it does not leave the screen or cover the hovered node when another side is available.
- Hover information includes purpose, why it exists, inputs, outputs, side effects, current selector state, evidence count, analysis-gap or external-boundary status, and whether deeper detail exists.
- Single-click pins the popover in place and stops pointer following.
- Clicking outside or pressing Escape unpins it.
- A pinned popover exposes an explicit action to open implementation evidence in the adjacent source drawer and actions to locate the same semantic object in other diagram views.
- Opening another diagram follows the configured reuse-window or always-new-window preference. Semantic detail inside the current diagram is controlled by global zoom.
- Full source and evidence do not belong in the transient hover state; they open in the adjacent source drawer.
- The transient popover follows the pointer with a small offset and updates at animation-frame speed or another throttled rate.
- Collision handling chooses another side when the preferred position would cover the node or leave the viewport.
- Clicking a node pins the same popover near the node; it must not jump to a distant inspector.
- The pinned state is visually explicit and remains until an outside click, Escape, close action, or navigation.
- The implementation-detail action must actually open the relevant source drawer. A decorative or inert action is not acceptable.

## Reference Acceptance Scenarios

These are mechanism stress tests, not product-specific architecture.

### Real-Time Audio Pipeline

Top-level capability: separate a reference song into vocals and accompaniment, extract vocal pitch, correct microphone pitch to the target, mix the corrected microphone stream with accompaniment, and play the result.

Expected feature tree:

- Vocal/accompaniment separation.
- Pitch extraction.
- Pitch correction.
- Mixing and playback.

Expected top-level execution view:

- Thread or execution context A obtains the reference song, performs separation, and emits vocal and accompaniment streams.
- Thread or execution context B reads the vocal stream, estimates pitch, combines it with microphone input, and emits a corrected stream.
- Thread or execution context C reads corrected voice and accompaniment and produces playback frames.
- Ring buffers or equivalent channels are explicit nodes/ports. The graph shows exactly which frame type is written and read at each boundary.
- Zooming the behavior canvas reveals pitch extraction's internal initialization and per-frame stages in place; continued zoom reveals terminal implementation groups.
- If a hardware interrupt or global clock provides strict cadence, the runtime view identifies `t0`, each cycle, per-step offsets, timestamps, clock source, and deadline.
- Architecture, behavior, and runtime remain independent synchronized canvases; code evidence appears beside the active canvas.

### Event-Driven Order Platform

- Show producers, brokers/topics, schemas, consumer groups, handlers, retries, backoff, dead-letter paths, and compensating actions using event-appropriate projections.
- Distinguish registration topology from one observed causal event sequence.
- Display message names, versions, payload contracts, correlation/causation identifiers, and delivery semantics when known.
- A dynamically registered consumer shows its registration selector and all repository-declared targets. A missing internal registration is an `analysis-gap`; a consumer outside the repository is an `external-boundary`.
- Selecting a consumer synchronizes its handler region in the behavior canvas; selecting one event instance can locate its causal sequence or runtime trace in the corresponding independent canvas.

### Request And Call Chain

- Show a request entering routing and middleware, calling an application service, accessing repositories or external services, creating state such as a session, and returning a response.
- A UML sequence projection is appropriate for participants and call/return order; architecture remains a separate C4 view.
- Parameter and return contracts must be visible without expanding every framework call.
- Low-value framework internals may be collapsed with evidence available on demand.

### Nested, Parallel, And Recursive Logic

- A parent flow can contain child flows, and child flows can contain further child flows; semantic zoom reveals these nested regions in place.
- Parallel branches show synchronization, shared channels, joins, races, and execution contexts when evidence exists.
- Direct and mutual recursion show the recurrence edge, base/termination condition, and current scope without infinite expansion.
- Repeated loops show conditions and summarized iterations; runtime traces may show individual observed iterations separately.

### Dynamic And Boundary-Dependent Systems

- Reflection, dependency injection, plugins, generated code, native calls, monkey-patching, and runtime configuration are modeled as declared selectors, choices, and boundaries wherever their setup is present in the repository.
- The UI distinguishes declared alternatives, conditions, available bindings, the currently selected branch, observed executions, analysis gaps, and external boundaries.
- Users and AI agents can add evidence or annotations, but the product preserves the distinction between an annotation, source-declared behavior, a current binding, and runtime observation.

## UX Acceptance Rules

- A beginner can start from a feature name rather than a symbol name.
- Every displayed relation answers what crosses the relation and why it exists.
- A high-level page remains readable without exposing the entire repository graph.
- Down and up navigation preserve scope and context.
- Independent diagram canvases can be placed on separate monitors and remain synchronized by semantic identity.
- No control that promises semantic zoom, panning, pinning, details, view opening, filtering, or language behavior may be inert in a prototype presented for approval.
- Text, labels, ports, and edges must remain readable without incoherent overlap at supported desktop and mobile sizes.
- The UI explains selection conditions, active bindings, analysis gaps, and external boundaries in beginner-friendly language without asking the user to interpret analyzer confidence.

## Open-Source References

- GitNexus / CodeGraph: first-pass structural graph candidates, not the final human visualization.
- Eclipse ELK Layered: ports, compound graphs, hierarchy, and cross-hierarchy layout.
- Node-RED subflows: collapsed reusable flow nodes, explicit ports, and separate child scopes.
- BPMN 2.0 / `bpmn-js`: standard business and orchestration process notation with embedded subprocesses.
- Structurizr / C4 and C4-PlantUML: software architecture levels, boundaries, components, and static relationships.
- Perfetto: tracks, slices, counters, flows, clocks, and runtime trace exploration.
- WaveDrom: hardware and digital timing diagrams.
- Flame Graph / Icicle: aggregate stack and cost exploration.
- Trace Compass: advanced trace-analysis concepts and alternative trace ecosystems.

## Removed Or Rejected Approaches

- No project landing page in the primary workflow.
- No feature-chain page or feature-chain section duplicating the flow view.
- No page-level navigation styled as tabs for switching between diagrams.
- No all-in-one page containing multiple diagram types while claiming they are independent.
- No universal coordinate space that overlays architecture, behavior, sequence, timing, and data-flow grammars.
- No dense universal relationship network as the main human-facing view.
- No custom generic box-and-arrow notation when an industry standard applies.
- No audio-specific product architecture. Audio remains only a stress-test example.
- No assumption that every mechanism can be recognized.
- No runtime language dropdown backed by pre-generated bilingual graph data.
- No fixed inspector far away from the hovered node as the only hover explanation.
- No click-to-pin control that visually claims to pin but immediately disappears or cannot open real detail.
- No click/double-click requirement for descending behavior hierarchy; wheel semantic zoom reveals detail within the current diagram canvas.
- No loading the complete lower-level project graph and merely hiding it at low zoom.

## Current Prototype Status

- The existing `prototype/` is a throwaway interaction prototype with simulated analysis data.
- It does not yet implement real GitNexus/CodeGraph ingestion, AI graph passes, Skills, CLI analysis, or persisted `.code_synapse/` artifacts.
- Its current navigation and several diagram renderings predate the decisions in this document and must not be treated as approved product behavior.
- Visual brainstorming files under `.superpowers/` are disposable review artifacts.
- `AGENTS.md` requires future agents to enter through `docs/design/README.md`, which lists this document as required canonical product context.

## Decision History

- Confirmed multi-language analysis architecture with TypeScript, JavaScript, and Python as initial source languages.
- Confirmed future expansion to C, C++, C#, and GDScript, with mobile, web, embedded, operating-system/low-level, scripting, and game repositories in architectural scope.
- Withdrew the premature selections of either external repository as the whole-product foundation; the comparison had conflated a reusable analyzer with the canonical product core.
- Confirmed an independent Code Synapse core using only `colbymchenry/codegraph` as the current external structural graph. CodeWiki and Understand Anything are excluded from the current provider set and roadmap unless the user explicitly reverses this decision.
- Confirmed a local web surface with CLI and Codex/Claude Code integration.
- Confirmed reuse of structural analyzers followed by AI semantic enrichment and persisted graph files.
- Confirmed Author and Bootstrap Skills for maintaining or adding semantic annotations.
- Rejected dense universal code graphs as the human-facing interface.
- Rejected one-page and tabbed diagram switching; confirmed independent synchronized windows.
- Removed the project landing page and separate feature-chain presentation from the primary workflow.
- Superseded the earlier click-to-open flow decision: feature-tree selection now locates the corresponding region, and wheel semantic zoom reveals nested detail in place.
- Confirmed default named-window reuse plus an optional always-new-window preference.
- Confirmed C4 as the architecture notation direction and strict separation from runtime flow.
- Confirmed project explanation language is chosen at import and generated once.
- Confirmed source identifiers remain untranslated.
- Confirmed hover-near-pointer, click-to-pin, adjacent source detail, and real semantic-zoom detail reveal.
- Extended the fixed-commit graph-foundation experiment with CodeGraph and selected it as the first structural provider based on stronger fixed-truth coverage, exact call sites, resolved calls, MIT integration, and incremental/full parity.
- Confirmed file-first integration: CodeGraph CLI builds/synchronizes `.codegraph/codegraph.db`; Code Synapse reads it directly and read-only through a schema adapter. Rejected a persistent CodeGraph provider process and summarized-text ingestion for the first version.
- Confirmed a Code Synapse-owned deterministic control-flow and selector-propagation layer above CodeGraph. Static conditions and all A/B paths are explicit symbolic behavior; configuration and runtime values only bind and highlight a declared result. Missing internal analysis is `analysis-gap`, and implementation outside the repository is `external-boundary`.
- Confirmed `docs/design/README.md` as the sole canonical design entry point. Detailed product and technical decisions live in the design document set; `AGENTS.md` retains only goals, principles, and maintenance rules.
- Confirmed a mandatory `ponytail` full-intensity design gate after design changes and before implementation planning, prototyping, or coding. The gate removes or defers unnecessary requirements and records its result in the implementation plan.
- Rejected the original broad first-phase foundation plan after Ponytail review. Confirmed a disposable end-to-end feasibility experiment as Phase 0 so the human semantic model, progressive drill-down, and evidence contract are proven before general CFG, multi-language, persistence, incremental, or packaging work.
- Confirmed the feature list remains a tree while capabilities use a collaboration graph that connects how capabilities cooperate.
- Confirmed separate synchronized canvases for distinct diagram grammars. Within each canvas, the wheel performs global semantic zoom and middle-mouse drag pans without changing semantic state.
- Confirmed top-level views load precomputed global summaries rather than the complete detailed graph; detail is loaded by semantic band and visible region only when needed.
- Confirmed Diff as an optional commit-to-commit overlay on existing diagrams and source evidence as an adjacent editor drawer, not separate diagrams.

## Open Design Questions

- Validate the exact industry-standard flow projection for each mechanism with separate visual examples.
- Finalize the pinned-popover detail layout and the actions available for nodes versus edges.
- Define the feature-tree-only page after removal of project and feature-chain content.
- Validate accessible Diff overlay styling and removed-object tombstones without changing base-diagram semantics.
- Validate the normalized symbolic behavior and evidence schema during the first vertical implementation slice.
- Recover or explicitly redefine the earlier audience option A before its phase begins; option C remains out of initial scope.
- Choose the exact non-tab window launcher or command surface.
