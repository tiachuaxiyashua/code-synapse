# Graph Foundation Experiment

This experiment compares the deterministic structural artifacts produced by
PorunC/CodeWiki and Egonex-AI/Understand-Anything, then measures what happens
when both artifacts are imported into one provider-neutral fact model.

The experiment deliberately separates three concerns:

1. Deterministic source parsing and structural graph extraction.
2. LLM enrichment supplied by either upstream product.
3. Code Synapse normalization, evidence preservation, and conflict handling.

Only concern 1 is used for source-language coverage, symbol recall, call recall,
runtime, and incremental-update measurements. LLM-dependent capabilities are
documented separately because model choice and repeated sampling would otherwise
confound the structural-foundation comparison.

## Reproduction

The fixed repositories, commits, source profiles, provider commits, and metric
definitions are in `manifest.json`. Human-verifiable checks selected before the
analyzers were run are in `ground-truth.json`.

Raw provider outputs are written below `results/<sample>/<provider>/`. Derived
normalization and comparison output is written below
`results/<sample>/combined/`. Disposable modified copies used for incremental
tests live below `work/`.

No upstream output is silently repaired. Unsupported languages, command
failures, unresolved calls, missing evidence, and conflicting facts remain
explicit experimental results.

## Commands

Use a CodeWiki 0.6.5 environment with the repository-locked
`tree-sitter==0.25.2`. `CODEWIKI_CACHE_ROOT` must point to a new, empty parent
for a cold run; each sample gets its own child cache.

```bash
CODEWIKI_BIN=path/to/codewiki \
CODEWIKI_CACHE_ROOT=experiments/graph-foundation/work/codewiki-cold-cache \
node experiments/graph-foundation/scripts/run-codewiki.mjs

UA_ROOT=path/to/Understand-Anything \
node experiments/graph-foundation/scripts/run-understand-anything.mjs

node experiments/graph-foundation/scripts/validate-ground-truth.mjs
node experiments/graph-foundation/scripts/evaluate.mjs
```

The incremental runner creates fixed disposable clones below `work/incremental/`
and refuses to overwrite an earlier run. Move that directory aside before an
intentional rerun so the previous evidence remains available.

```bash
CODEWIKI_BIN=path/to/codewiki \
UA_ROOT=path/to/Understand-Anything \
node experiments/graph-foundation/scripts/run-incremental.mjs
```
