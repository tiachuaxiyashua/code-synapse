# CodeGraph SQLite Foundation Design

## Status

Approved candidate foundation direction. Production implementation is deferred until the Phase 0 end-to-end feasibility gate in `docs/design/product.md` passes.

## Precondition: Core Feasibility Gate

Do not implement this foundation from the bottom up. First reuse the existing CodeGraph experiment database, source sample, AI coding agent, and disposable web prototype to prove that the available evidence can produce a faithful feature tree, capability collaboration summary, globally semantically zoomable behavior flow, conditions/results, data transfers, and exact implementation evidence in the adjacent source drawer.

The feasibility experiment may hard-code one sample and pre-generate a few semantic bands. It may skip the general adapter, canonical schema, multi-language analyzers, real viewport chunking, incremental rebuilds, atomic publishing, production CLI, and packaging. None of those omissions reverse the approved direction; they avoid building it before its consumer model is proven.

If the feasibility gate fails, revise this document before implementation. If it passes, implement the smallest production slice demonstrated by the experiment, then expand one evidenced need at a time.

## Confirmed Decisions

- The current implementation uses only `colbymchenry/codegraph` for the external structural graph.
- Do not implement or plan Understand Anything or CodeWiki adapters in the current roadmap.
- Do not fork CodeGraph.
- CodeGraph CLI is invoked only to create, synchronize, inspect, or rebuild its index.
- Code Synapse reads `.codegraph/codegraph.db` directly and read-only after CodeGraph finishes writing.
- Do not add a persistent CodeGraph provider process in the first version.
- Do not retrieve structural facts by parsing `codegraph_explore` or other human/agent-oriented summarized text.
- Code Synapse adds its own deterministic control-flow extraction above CodeGraph's cross-symbol graph.
- Static branches and their predicates are program behavior and must appear in the appropriate flow scope.
- Configuration, input, state, event, build, and runtime values are selectors that bind and highlight code-declared branches; they do not create branches.
- Missing selector values remain unbound. Missing internal analysis is `analysis-gap`; implementation outside the repository is `external-boundary`.
- Code Synapse owns semantic scopes, explanations, projections, changes, and `.code_synapse/` artifacts.

## Goals

- Preserve CodeGraph facts without truncating or summarizing them during ingestion.
- Keep the first implementation small: one analyzer, one SQLite adapter, one update path.
- Turn a symbol/call graph into hierarchical program flows that retain conditions, loops, errors, recursion, data exchange, and source evidence.
- Build a deterministic symbolic behavior graph and distinguish declared choices, selector bindings, selected branches, observed executions, analysis gaps, and external boundaries.
- Avoid coupling Code Synapse's semantic files and UI to CodeGraph table names or IDs.
- Support TypeScript, JavaScript, and Python first without blocking later language-specific analyzers.

## Non-Goals

- No CodeWiki or Understand Anything runtime, adapter, schema, or compatibility layer.
- No CodeGraph fork.
- No persistent provider daemon for CodeGraph.
- No whole-graph JSON export in the normal product path.
- No assumption that CodeGraph already provides function-level control-flow graphs.
- No automatic execution of imported repositories.
- No claim that Tree-sitter-level C/C++ or C# analysis replaces compiler semantics.

## Architecture

```text
Source repository
       |
       v
CodeGraph CLI: init / sync / status
       |
       v
.codegraph/codegraph.db
       |
       v
CodeGraph SQLite Adapter (read-only, version-gated, paged queries)
       |
       +--> symbols, cross-symbol relations, source locations
       +--> provenance, confidence, resolution method
       +--> unresolved references
       |
       v
Code Synapse Control-Flow Extractor
       |
       +--> decisions and predicates
       +--> branch membership
       +--> loops, returns, throws, try/catch/finally
       +--> call sites inside precise control-flow positions
       |
       v
Selector And Predicate Propagation
       |
       +--> configuration/input/state/event reads
       +--> aliases and derived predicate values
       +--> symbolic branches and results
       +--> optional active bindings
       |
       v
Scope and Semantic Pipeline
       |
       +--> feature hierarchy
       +--> hierarchical flows
       +--> module responsibilities
       +--> mechanism hypotheses
       +--> beginner explanations
       +--> change and conflict analysis
       |
       v
.code_synapse/ semantic artifacts and independent web views
```

## Storage Ownership

### `.codegraph/`

`.codegraph/codegraph.db` is the complete current structural index produced by CodeGraph. Code Synapse reads it directly instead of copying every node and edge into another full structural database.

The CodeGraph database is:

- local and rebuildable from a repository commit;
- owned by the pinned CodeGraph version;
- read through one schema adapter;
- not committed as Code Synapse's portable semantic model;
- never queried directly by browser code, Skills, AI prompts, or diagram renderers.

### `.code_synapse/`

`.code_synapse/` stores only Code Synapse-owned information and stable references into source code:

```text
.code_synapse/
├── manifest.json
├── identities.jsonl
├── control-flow/
├── selectors/
├── scenarios/
├── scopes/
│   ├── features.json
│   ├── modules.json
│   └── flows/
├── semantics/
│   ├── explanations.jsonl
│   └── mechanisms.jsonl
├── projections/
├── changes/
└── snapshots/
```

`manifest.json` records the repository commit, CodeGraph version, extraction version, SQLite schema version, database fingerprint, explanation language, Code Synapse schema version, and last successful build.

Code Synapse identities must not equal raw CodeGraph IDs. A stable identity is derived from language, repository-relative path, symbol kind, qualified name, and signature, with source range retained as versioned evidence. Raw CodeGraph IDs remain optional provider references for diagnostics.

## CodeGraph Invocation And Read Transaction

### First import

1. Acquire the per-project analysis write lock.
2. Run the pinned `codegraph init <project>` command.
3. Wait for the command to exit.
4. Read CodeGraph status and error output.
5. Reject an empty or internally failed index even when the process exit code is zero.
6. Open `.codegraph/codegraph.db` read-only.
7. Validate `schema_versions`, extraction version, expected tables, and project identity.
8. Build stable identity mappings and affected semantic artifacts.
9. Atomically publish the new Code Synapse manifest.
10. Release the write lock.

### Incremental update

1. Record the old repository/index fingerprint and affected structural slice.
2. Acquire the write lock and stop new queries for that project.
3. Run `codegraph sync <project>` and wait for completion.
4. Reopen the SQLite database read-only; do not reuse a connection opened before sync.
5. Validate status, errors, schema, pending changes, and database fingerprint.
6. Determine added, modified, removed, and impact-related stable identities.
7. Rebuild only affected control-flow scopes, semantic scopes, explanations, and projections.
8. Compare old and new structural/semantic slices and write a change record.
9. Atomically publish the new manifest, then resume queries.

If validation or incremental parity fails, retain the previous published semantic artifacts and perform a cold CodeGraph rebuild. A failed rebuild must not destroy the last readable Code Synapse state.

SQLite is opened through a read-only connection with prepared, paged queries. Normal operation never serializes the full C++ graph to JSON. If a consistent database copy is required for diagnostics, use SQLite's backup/snapshot mechanism rather than copying only the main file while WAL sidecars may still be active.

## SQLite Adapter Boundary

Only the SQLite adapter knows CodeGraph table and column names. Its contract exposes provider-neutral values:

```text
health(project) -> index version, schema version, state, errors
listEntities(filter, cursor) -> bounded entity page
getEntity(providerId) -> raw structural entity
listRelations(filter, cursor) -> bounded relation page
listUnresolved(filter, cursor) -> bounded unresolved-reference page
getNeighborhood(entity, depth, limits) -> bounded graph slice
getChangedFiles(previousFingerprint) -> changed files or unavailable
```

The adapter must preserve:

- original provider ID;
- entity kind, language, qualified name, signature, and source range;
- relation kind, call site, metadata, provenance, confidence, and `resolvedBy`;
- original reference text;
- unresolved-reference state and candidates;
- provider and schema versions.

Unknown schema versions fail closed with a clear rebuild/upgrade message. Code Synapse does not guess column meanings after an upstream migration.

## Deterministic Symbolic Behavior Model

The user-facing model is:

```text
Capability
-> Use case
-> Scenario
-> Behavior step
-> Selection condition and result
-> Implementation evidence
```

Static analysis builds the complete behavior space declared by source code. It does not choose one branch and discard the others. Each relationship or step records:

- `declared`: the code declares the operation, transfer, target alternative, or path;
- `condition`: the exact symbolic predicate guarding it;
- `selector`: the configuration, input, state, event, platform/build choice, registration, or runtime value that supplies the predicate;
- `selected`: the current bindings activate this declared result;
- `observed`: a specific runtime execution traversed it;
- `analysis-gap`: the implementation is in the repository but Code Synapse did not recover it;
- `external-boundary`: the implementation or deciding value is outside the imported repository.

CodeGraph's confidence, resolution method, candidates, and unresolved records remain internal provider evidence. Code Synapse uses source ASTs, types, assignments, registrations, framework rules, and configuration propagation to construct the behavior model. An unresolved provider edge is not itself a statement that the program is uncertain.

Do not pre-generate every combination of branches. Store predicates and choices symbolically, then materialize a scenario on demand from a requested use case, selector binding set, desired result, or observed execution.

## Configuration And Selector Binding

Configuration files are only one possible source of selector bindings. Code Synapse first infers required selectors from code reads, defaults, schemas, manifests, examples, tests, dependency-injection registrations, and framework settings. It then performs bounded data propagation from the read through aliases and derived values to the branch predicate or selected target.

For example:

```ts
const mode = config.get("MODE");
const fast = mode === "fast";

if (fast) runFast();
else runSafe();
```

produces this symbolic record even when no configuration file exists:

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

When a repository configuration, selected profile, environment snapshot, or explicit user binding supplies `MODE=fast`, Code Synapse sets `activeValue` and `activeBranch` and highlights the fast branch. The safe branch remains in the model because it is still declared program behavior. Missing configuration therefore means "selector currently unbound," not uncertainty.

## Deterministic Control-Flow Extraction

CodeGraph provides symbols and cross-symbol relations. Code Synapse must add function-local control flow for initial TypeScript, JavaScript, and Python support.

The extractor recognizes, where the language supports them:

- entry and exit;
- sequential operations;
- `if`/`else`, conditional expressions, `switch`, and `match`;
- loops, loop conditions, `break`, and `continue`;
- direct and mutual recursion links;
- `return`, `throw`, and early exits;
- `try`, `catch`/`except`, and `finally`;
- `await` and explicit parallel/join constructs;
- callback or event registration sites;
- call expressions and their containing branch/loop/error region.

Branch predicates and source ranges are deterministic evidence. A call directly present inside a branch is deterministically a member of that branch. If several repository-declared targets are selectable, store every target with its selector condition. If the target cannot be recovered, classify the result as `analysis-gap` or `external-boundary`.

Function-local flows are composed across CodeGraph call edges into bounded hierarchical scopes. Composition must not inline the entire repository. A composite call remains a child-flow node with explicit inputs, outputs, control condition, and stable parent context.

Recursion is represented as a recurrence edge back to a known scope plus its base/termination conditions. It is never expanded indefinitely.

## Branch Classification

Every branch remains represented at some level, but not every branch becomes a feature-tree node.

### Feature variant

Promote a branch to a child capability/feature when it has an independently understandable user or domain purpose, observably different outcome, independent rule or permission, or language a user would naturally describe as a feature.

Examples: administrator login, guest checkout, credit-card payment, offline synchronization.

### Flow branch

Keep a branch in the current flow when it changes behavior but is not an independent user capability.

Examples: cache hit/miss, existing/new record, retry/fail, accepted/rejected message.

### Implementation guard

Keep low-level safety or algorithm branches inside the terminal function flow.

Examples: null checks, empty-array handling, bounds checks, parser fast paths.

AI may propose this semantic classification, but it must cite the deterministic branch, predicate, outputs, callers, tests, annotations, or documentation. Reclassification changes presentation scope, not the underlying control-flow facts.

## Static Flow And Runtime Evidence

Static flow shows all discovered paths and their predicates. Runtime evidence is optional and never replaces those paths.

```text
Static:  condition C -> A when true, B when false
Runtime: execution 123 observed C=true and traversed A
```

Runtime evidence may later add actual target selection, execution order, thread/task identity, timestamps, duration, frequency, counters, or deadlines. The first version does not automatically run imported code and does not require runtime evidence to build static flows.

A current configuration or explicit binding adds a selected-path overlay to the same static flow. With no binding, selectors remain visibly unbound and no declared branch is hidden.

## Semantic Enrichment

Code Synapse builds bounded AI evidence packs itself. It queries the SQLite adapter for a scoped neighborhood, reads exact source ranges, adds control-flow facts, types, callers, callees, tests, and stable annotations, and asks the model for schema-constrained output.

AI is used for:

- human purpose and why the code exists;
- feature ownership and hierarchy;
- module responsibility;
- branch classification;
- mechanism hypotheses;
- beginner terminology and implementation explanation.

AI does not invent missing calls, conditions, parameters, timing, or runtime selection. Every semantic claim stores source evidence, model/prompt version, source/index fingerprint, and confidence. Structural views remain available when AI generation fails.

## Error Handling

- Exit code zero plus an empty graph is failure, not success.
- `errors.log`, status, schema, pending changes, and structural counts are part of health validation.
- An unsupported required language capability is an `analysis-gap` with the missing provider named.
- Raw CodeGraph unresolved references remain available as provider evidence and are never converted directly into resolved behavior.
- Repository-declared candidate targets are preserved with their selector conditions. A target missing after Code Synapse analysis is classified as `analysis-gap` or `external-boundary` with evidence.
- A CodeGraph schema mismatch stops ingestion until an adapter migration or pinned-version rebuild is available.
- AI failure leaves deterministic facts and control flow intact.
- Large neighborhoods are paged and bounded. If a requested analysis cannot complete within a declared bound, emit an explicit `analysis-gap` rather than silently truncating behavior.

## Security And Versioning

- Pin CodeGraph version and commit for development and reproducible fixtures.
- Require a patched `picomatch` version before product packaging.
- Disable or disclose telemetry according to product privacy policy.
- Never execute imported repository code during static import.
- Validate repository paths and prevent queries outside the imported root.
- Treat source and database contents as untrusted input.
- Store no external AI credentials in project artifacts.
- Changing CodeGraph or extraction versions invalidates affected structural and semantic caches.

## Acceptance Criteria

- TypeScript, JavaScript, and Python fixtures preserve CodeGraph entity, relation, call-site, provenance, confidence, resolution, and unresolved-reference fields.
- Normal ingestion reads SQLite directly and performs no whole-graph JSON export.
- An unknown CodeGraph schema fails with an actionable error.
- A zero-exit empty/internal-failure index is rejected.
- One-file incremental sync updates only affected structural and semantic scopes and matches a cold-rebuild fixture.
- Direct `if`/`else`, switch/match, loop, return/throw, try/catch, and call-site branch membership fixtures generate deterministic control-flow facts.
- A direct call inside a known branch is shown under the exact predicate.
- TypeScript/JavaScript and Python fixtures propagate configuration reads through aliases and derived booleans into exact branch predicates.
- With no configuration file, every declared branch remains present and the selector is unbound.
- With a supplied binding, the selected branch is highlighted without removing alternatives.
- Repository-declared dynamic target alternatives retain their selector conditions and never become unconditional calls.
- Internal analysis failures and out-of-repository implementations are emitted as `analysis-gap` and `external-boundary` respectively.
- Scenarios are materialized on demand from symbolic predicates; the build does not enumerate every selector combination.
- Feature variants, flow branches, and implementation guards remain distinct presentation levels.
- Runtime evidence, when absent, does not prevent static flow generation.
- Browser views and AI tools consume Code Synapse query contracts, never CodeGraph tables directly.

## Deferred Work

- Compiler-grade C/C++ semantics through Clang-family evidence.
- Roslyn/MSBuild evidence for C#.
- Godot/GDScript scene, resource, signal, lifecycle, and language-server evidence.
- Runtime trace import and observed-path overlays.
- Additional external graph providers. CodeWiki and Understand Anything are specifically out of the current roadmap unless the user later reverses this decision.
