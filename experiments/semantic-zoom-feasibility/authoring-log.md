# Semantic Authoring Log

## Run 1

- Date: 2026-07-14
- Author: current Codex agent
- Prompt: `experiments/semantic-zoom-feasibility/AI_PROMPT.md`, version 1
- Evidence: locally generated `evidence.json`, schema 1, sample commit `7ce1b4690c4e96659cb1ed0d367b08b3ab35a24b`
- Model: `experiments/semantic-zoom-feasibility/model.raw.json`
- Context disclosure: the same agent previously prepared and reviewed the experiment, so it had prior project context. During authoring it used only the allowed evidence files and did not read the old hard-coded model. This is weaker isolation than a fresh external model run and is recorded as a Phase 1 limitation.
- Manual label corrections: 0
- Manual topology corrections: 0
- Validator result: initially passed the first structural rules, then failed the strengthened product-truth gate during required evidence review
- Rejection reasons: Z0 omitted the generic signup error forwarded to Express; Z1 repeated the same signup event relationship

## Run 2

- Date: 2026-07-14
- Author: current Codex agent
- Prompt: `experiments/semantic-zoom-feasibility/AI_PROMPT.md`, version 2
- Evidence: unchanged Run 1 evidence pack
- Previous output: retained as `model.run1.rejected.json`
- Model: `experiments/semantic-zoom-feasibility/model.raw.json`
- Manual label corrections: 0
- Manual topology corrections by a programmer: 0
- AI regeneration changes required by the gate: replace the narrow Z0 record-failure projection with the externally visible signup error-forward result; remove the duplicate Z1 signup-event relation; classify signin error forwarding as an implementation step rather than a third user outcome
- Validator result: passed the strengthened deterministic validator; full experiment suite passed 29/29 after semantic classification review
- Rejection reasons: none after Run 2
