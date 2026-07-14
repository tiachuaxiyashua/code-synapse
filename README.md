# Code Synapse

Code Synapse is an open-source experiment for helping non-programmers and new AI-coding users understand an existing codebase from user-facing capabilities down to exact implementation evidence.

The project does not present a dense repository call graph as its primary interface. It builds persistent, evidence-backed human models: feature hierarchy, complete behavior, branch conditions and results, data or event transfers, progressive semantic detail, and source evidence.

## Current Status

The project is starting Phase 1, a deliberately narrow feasibility test:

```text
real TypeScript sample + CodeGraph/source evidence
  -> constrained semantic model
  -> feature tree + globally zoomable behavior flow
  -> adjacent source evidence
  -> beginner comprehension gate
```

This phase is not a production release. It does not yet claim multi-language support, all diagram types, automatic AI APIs, large-repository performance, or editor Skills.

## Documentation

- Long-term product and technical design: `docs/design/README.md`
- Phase 1 project brief and document index: `docs/phase-1/README.md`
- Phase 1 product requirements: `docs/phase-1/prd.md`
- Phase 1 implementation plan: `docs/phase-1/implementation-plan.md`
- Executable OpenSpec change: `openspec/changes/phase-1-semantic-flow-poc/`
- Structural-provider experiment: `experiments/graph-foundation/results/REPORT.md`

## Existing Prototype

`prototype/` is an earlier disposable visual prototype with simulated data. Its click-to-drill behavior and generic diagrams are retained only as evidence and a comparison baseline; they are not the approved product behavior.

Run it locally:

```bash
cd prototype
npm ci
npm run dev
```

## Development Principles

- Every functional claim shown to a user must link to source or analyzer evidence.
- Source-declared branches are deterministic behavior; configuration and runtime values select declared paths rather than creating probabilities.
- Different diagram grammars use independent pages and coordinate spaces.
- New implementation follows the Phase 1 OpenSpec tasks and test-first development.
- Large third-party samples, analyzer databases, caches, dependencies, and generated artifacts are not committed.

## License

MIT

