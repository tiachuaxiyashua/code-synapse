## Context

The repository contains a disposable React/React Flow prototype and a completed structural-provider experiment, but no real semantic-zoom vertical slice. The canonical product design requires evidence-backed human models, independent pages, global semantic zoom, and explicit conditions/transfers. The phase-one work must test those claims before building the production CodeGraph adapter, multi-language control-flow layer, renderer router, Skills, or large-project infrastructure.

The implementation detail and project sequencing source is `docs/phase-1/README.md`; this artifact records the OpenSpec-level technical decisions.

## Goals / Non-Goals

**Goals:**

- build one reproducible TypeScript registration/login evidence pack;
- persist one constrained AI-authored semantic model and reject unsupported content;
- render a feature tree and a three-band flow in independent web pages;
- validate semantic zoom, middle-button pan, nearby explanation, source evidence, and beginner comprehension;
- preserve boundaries that allow later analyzers and projections to replace phase-one shortcuts.

**Non-Goals:**

- production CodeGraph lifecycle and version adapter;
- JavaScript/Python/C/C++/C#/GDScript implementation;
- every canonical diagram, Diff, runtime traces, selector binding, Skills, AI API, packaging, or large-repository loading.

## Decisions

### Use a disposable vertical slice rather than a production foundation

The primary risk is semantic usefulness and truth, so work proceeds evidence -> model -> UI -> user gate. Building general infrastructure first would make failure expensive without reducing that risk.

Alternative rejected: implement canonical storage, multi-language CFG, incremental rebuild, and renderer adapters before user validation.

### Use file contracts between stages

`evidence.json` separates source/CodeGraph facts from `model.json`; a validator atomically publishes the browser artifact. Files are inspectable, reproducible, and callable by the current AI agent without an API integration.

Alternative deferred: a database-backed service and automatic model-provider abstraction.

### Keep analyzer, semantics, and projection identities separate

Evidence retains raw provider IDs, semantic objects use stable experiment IDs, and visual nodes reference semantic IDs. CodeGraph tables never reach the browser, and coordinates never enter semantic objects. This is the minimum separation needed for later languages and diagram types.

### Reuse the existing web toolchain but not the old graph behavior

The experiment uses the installed React/Vite/Playwright packages. The new canvas uses native SVG because phase one needs a read-only bounded diagram, semantic-band replacement, wheel anchoring, and middle-button pan; the current React Flow prototype is click-to-drill, draggable, and exposes generic graph controls that do not validate the approved interaction.

Alternative deferred: ELK or a standards renderer. Automatic layout is not the risk under test and would add a dependency before the projection grammar is validated.

### Render only the current semantic band

Z0/Z1/Z2 are separate projections over shared semantic IDs and stable parent regions. Hysteresis controls band changes. This prevents hidden lower-detail graphs from consuming render resources and makes the phase behavior measurable.

### Synchronize semantic selection only

Feature and flow are separate URLs connected by one `BroadcastChannel`. Selection is shared; camera state remains local. This tests the product's independent-page boundary without building a general cross-window state platform.

## Risks / Trade-offs

- **The sample overfits request/response code** -> GO authorizes only another grammar experiment, not general support.
- **Manual visual coordinates hide layout problems** -> coordinates live only in the disposable projection; automatic layout is a separate post-GO experiment.
- **Current AI agent output is not repeatable like an API** -> retain prompt, evidence, raw model, corrections, and validator results; automatic provider work remains deferred.
- **A static JSON file does not prove large-project performance** -> enforce bounded scope and active-band rendering; validate regional loading separately after GO.
- **Three visual bands may not cover arbitrary domain depth** -> semantic parent links permit arbitrary depth; phase bands are projections, not a core hierarchy limit.
- **Third-party sample and generated databases are large** -> pin URLs/commits in manifests and ignore all downloaded/generated contents.

## Migration Plan

1. Add the experiment alongside the old prototype using a separate HTML entry.
2. Keep old pages as the comparison baseline during phase-one review.
3. On STOP, retain evidence and review records but do not promote phase code.
4. On REVISE, change only the failed semantic or interaction layer and repeat the same gate.
5. On GO, treat the validated contracts as input to the next narrow design; do not silently convert the phase prototype into production.

## Open Questions

No decision blocks phase-one implementation. Exact production layout engines, analyzer adapters, renderer routing, AI providers, and large-project query services remain intentionally unresolved until the gate supplies evidence.
