# Code Synapse Design Index

This directory is the single source of truth for Code Synapse product and technical design. `AGENTS.md` contains only working principles and points here; it must not duplicate detailed decisions.

## Canonical Documents

Read these documents in order:

1. `docs/design/product.md` - product goal, audience, conceptual model, complete confirmed requirements, UX behavior, rejected approaches, acceptance scenarios, and open product questions.
2. `docs/design/codegraph-foundation.md` - candidate post-feasibility foundation: CodeGraph lifecycle, direct SQLite adapter, deterministic control flow, selectors and configuration binding, symbolic behavior storage, failures, and foundation acceptance criteria.
3. `docs/design/visual-model.md` - canonical diagram inventory, separate synchronized canvases, global semantic zoom, loading boundaries, source drawer, and Diff overlays.

Both documents are normative and must agree. `product.md` defines product meaning and constraints; `codegraph-foundation.md` may specialize the current implementation but cannot weaken or contradict the product model. If a conflict is found, stop using the conflicting wording and update both documents in the same change.

## Non-Canonical Material

- `experiments/` contains reproducible evidence and historical comparisons. Evidence may motivate a decision but does not become a decision until recorded here.
- `docs/superpowers/plans/` contains execution plans. A plan must implement this design and cannot redefine it.
- `docs/phase-1/README.md` is the entry point for the current feasibility project's PRD, software design, implementation, and test plans. It operationalizes this design but cannot redefine it.
- `prototype/` and `.superpowers/` contain disposable interaction or visual experiments. Their current behavior is not approved unless this design explicitly says so.
- Conversation summaries and agent memory outside this repository are not authoritative.

## Required Ponytail Gate

Every new or materially changed design must pass a `ponytail` review at `full` intensity before implementation planning, prototyping, or coding begins.

The review asks, in order: whether each requirement is needed now, whether the repository already provides it, whether the standard library or native platform covers it, whether an installed dependency covers it, and only then what minimum new code is necessary. Remove speculative requirements, defer abstractions and extension points without a current use, and prefer the smallest testable vertical slice.

Apply accepted reductions directly to the canonical design documents. Record `Ponytail Gate: passed` with a one-line summary in the resulting implementation plan. A plan marked `pending` must not be executed.

## Change Rule

When a decision changes:

1. Update the relevant canonical document instead of adding a competing note elsewhere.
2. Remove or rewrite superseded statements in every canonical document.
3. Add the decision to the history in `docs/design/product.md` when it changes product direction.
4. Search the canonical design set for contradictory terminology before considering the update complete.
5. Run the required Ponytail gate before creating or updating the implementation plan.
