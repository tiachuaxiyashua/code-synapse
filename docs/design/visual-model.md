# Code Synapse Visual Model

This document is the canonical specification for how Code Synapse organizes and navigates visual explanations. It defines visual meaning independently of any renderer.

## Core Separation

Code Synapse does not use one universal graph and does not place different diagram grammars in one coordinate space.

- The feature list is a tree, not a diagram. It answers what functions exist and how functions contain or group other functions.
- Capabilities are nodes in a capability collaboration graph. It answers which abilities collaborate to deliver the system's overall purpose and what they exchange.
- Each other diagram type has its own independent web page/window and its own canvas.
- Separate canvases synchronize selected semantic object, current scenario/configuration, Diff selection, and semantic detail band where a meaningful mapping exists. Each canvas retains its own camera position because different diagram grammars use different coordinates.
- Architecture, behavior, interaction, time, state, and data must never be overlaid merely because they refer to the same code.

## Diagram Inventory

### Always Available

1. **Feature tree.** Hierarchical function/use-case index and search surface. Selecting a feature locates and centers its corresponding capability or behavior region; it does not replace the canvas with a child page.
2. **Capability collaboration graph.** Global product view. Capabilities and sub-capabilities are nodes; edges state the data, event, state, or control exchanged and why the collaboration exists.
3. **Behavior/process flow.** Declared steps, choices, conditions, results, loops, parallel regions, joins, retries, exceptions, and recursion for a capability or scenario.
4. **Layered software architecture.** Systems, containers, components, modules, layer boundaries, responsibilities, dependency direction, provided/required interfaces, allowed rules, and violations. Runtime order is excluded.
5. **Interaction/collaboration topology.** The participants that can interact, their stable channels/interfaces, and what interactions exist. It answers who can communicate with whom, not the order of one execution.
6. **Software sequence.** Logical ordering of calls, messages, returns, alternatives, loops, and asynchronous sends for one scenario. Spacing does not imply measured duration.
7. **Data flow.** Sources, sinks, transformations, stores, queues/buffers, ownership, schemas/types, and data lineage through a capability or system.

### Generated When Evidence Supports Them

8. **State machine.** States, transitions, guards, triggering events, actions, initial/final states, and nested states for stateful entities or protocols.
9. **Event topology.** Producers, event types, brokers/topics, subscriptions, consumer groups, delivery semantics, retries, dead letters, and compensating behavior. One event instance may be correlated with the software-sequence canvas.
10. **Software runtime timeline.** Measured process/thread/task/coroutine tracks, spans, waits, scheduling, concurrency, timestamps, duration, counters, deadlines, and causal links. It requires runtime evidence and uses a real time axis.
11. **Communication/signal timing.** Protocol frames, bus transactions, clock domains, hardware signals, interrupts, edges, cycles, and strict timing constraints. It requires protocol or hardware timing evidence.
12. **Data/domain model.** Domain entities, types, message schemas, database structures, relationships, constraints, versioning, and ownership.
13. **Deployment/runtime topology.** Devices, processes, applications, containers, servers, networks, trust boundaries, connections, protocols, and deployed artifacts.

### Evidence, Not User-Facing Diagram Types

- Raw call graphs and control-flow graphs feed behavior and sequence projections.
- Raw dependency graphs feed architecture projections.
- Concurrency evidence feeds behavior, data flow, and runtime timeline projections.
- Source evidence is shown in an editor-style drawer, not as a graph.
- Change, configuration selection, runtime observation, performance, security, and analysis coverage are overlays on existing diagrams, not new base diagrams.

## Canvas And Input Model

Every diagram page provides one logical infinite canvas.

- Mouse wheel changes the global camera zoom around the pointer location.
- Holding the middle mouse button and moving the pointer pans the camera.
- Panning never changes semantic detail or selects the object under the pointer.
- Zoom is global for that canvas. It is not local expansion based on the object under the pointer.
- Clicking selects a semantic object and may open or pin its explanation. It does not navigate to a lower-level page.
- Clicking a node, edge, condition, message, or data object can open an editor-style source drawer beside the canvas with exact source lines, configuration, tests, annotations, or runtime evidence.
- Closing the drawer restores the full canvas width without changing camera or selection.

## Semantic Zoom

Semantic zoom changes representation and visible detail rather than merely making the same labels larger.

The canonical bands are conceptual, not fixed pixel values:

| Band | Meaning | Typical content |
| --- | --- | --- |
| `Z0 Overview` | Whole-project summary | system purpose, major capabilities or system boundaries, aggregate relationships |
| `Z1 Domain` | Capability/domain detail | sub-capabilities, use cases, containers, major stores/events and collaboration |
| `Z2 Mechanism` | Executable mechanism | processes, components, participants, transformations, states and explicit conditions |
| `Z3 Implementation` | Implementation structure | functions/handlers, exact messages, parameters/returns, state reads/writes and error paths |
| `Z4 Evidence` | Terminal implementation groups | statement groups, exact evidence markers and analysis gaps; full source remains in the drawer |

Each diagram maps these bands to its own grammar. A sequence canvas reveals more participants and nested messages; an architecture canvas reveals deeper C4/layer elements; a data-flow canvas reveals transformations and fields. It does not morph a sequence diagram into architecture or mix both notations.

Detail changes follow these rules:

- One global scale determines the visible band for the entire canvas.
- Parent bounds, anchor points, and semantic identities remain stable across bands.
- Child coordinates are stored relative to a stable parent region.
- Higher-detail content fades in within its parent; zooming out aggregates it back into the same parent.
- Aggregate edges split into their constituent relationships at higher detail. They must preserve counts and relationship kinds so aggregation is not misleading.
- Use hysteresis at band thresholds to prevent small wheel movements from repeatedly toggling content.
- Labels, ports, and edges appear only when they can be read at the current scale; hidden details are absent from the render tree rather than rendered invisibly.
- Zooming out never loses the current selection. Its nearest visible ancestor is highlighted and records that a selected descendant exists.

## Top-Level Completeness

`Z0` is a complete global summary, not a miniature rendering of all code.

- The capability collaboration canvas shows every major capability required to describe the system's purpose and all material cross-capability exchanges.
- The behavior canvas shows the complete top-level process, including major alternatives and parallel branches, but collapses internal steps.
- If a top-level graph contains thousands of objects, semantic grouping has failed. Rendering more objects is not an acceptable substitute for better abstraction.
- Every aggregate node and edge records what it summarizes and whether more detail exists, even though the child data is not loaded yet.

## Loading And Performance Model

The product exposes one logical canvas without loading the whole repository into the browser.

```text
project/index
-> diagram root summary
-> semantic-band manifest
-> visible region chunks
-> source excerpt on selection
```

- The initial request loads only the selected diagram's `Z0` summary and its spatial manifest.
- Crossing a semantic zoom threshold loads the next band for visible regions only. It must not fetch all lower-level project content and then hide it.
- Diagram projections are stored by diagram type, semantic band, and stable spatial/semantic region.
- Low-detail relationships are pre-aggregated. The browser does not compute whole-project aggregation during interaction.
- Loaded regions may be cached with a bounded least-recently-used policy; distant detail can be released while its summary placeholder remains.
- Layout is computed and cached outside the interaction frame. Panning and zooming do not trigger whole-graph layout.
- Source drawers request only cited excerpts until the user explicitly opens a full file.
- Worker, viewport chunking, and advanced cache infrastructure are added only after measurement shows the simple band-per-region loader misses its interaction budget.

Initial performance budgets are validation targets, not guaranteed product limits:

- `Z0` summary: normally at most 100 visible objects and 200 visible relationships;
- active render tree: target at most 500 nodes and 1,000 relationships;
- initial diagram payload: target below 2 MB;
- interaction: target 60 FPS and must not remain below 30 FPS during ordinary pan/zoom.

## Synchronization Between Independent Canvases

- Semantic identity, not screen coordinate, links the same capability, module, handler, event, state, or data object across views.
- Selecting an object broadcasts its identity. Other open views highlight and, when requested by the user, center the closest corresponding object.
- Semantic detail bands may synchronize by abstract depth, but each view may clamp to its supported range. Camera scale and pan coordinates are never copied between unlike diagrams.
- A pinned view may ignore selection-follow navigation while still showing that another view changed selection.
- Opening another diagram type uses the default named-window reuse behavior; the optional always-new-window preference applies to opening views, not semantic zoom.

## Diff Overlay

Change impact is not a separate diagram.

- No Diff selection means no change decoration appears.
- The user chooses a base commit and target commit on any diagram page.
- Added semantic objects/relationships use green; modified behavior/contracts/conditions use amber; removed objects/relationships remain in their former position as red, reduced-opacity tombstones.
- Unchanged context remains visible at reduced emphasis so impact stays understandable.
- Diff aggregation follows semantic zoom: a changed descendant marks its visible ancestor at low detail; zooming in reveals the exact changed elements.
- A legend and accessible non-color indicator distinguish added, modified, and removed states.
- The source drawer shows the corresponding source diff for a selected changed object.

## Source Drawer

- The drawer is adjacent to the current canvas, not an independent graph or mandatory separate page.
- It opens from any cited visual object and shows repository-relative path, exact lines, syntax-highlighted source, purpose, inputs/outputs, side effects, conditions, evidence type, current binding/observation, and relevant Diff.
- Multiple evidence locations are selectable inside the drawer.
- The drawer never invents source for a semantic claim. Missing internal evidence is shown as `analysis-gap`; out-of-repository implementation is `external-boundary`.

## Phase 0 Validation Scope

The first implementation validates the new navigation model with one real TypeScript authentication sample and two representative canvases:

1. capability collaboration, which tests global topology, aggregation, and sub-capability reveal;
2. behavior flow, which tests global process completeness, branches, data transfer, and implementation reveal.

It also includes the feature tree, synchronized selection/detail band, and source drawer. Other diagram grammars, Diff overlays, viewport chunking, and production rendering engines are deferred until this interaction proves easier to understand than the previous click-to-drill prototype.
