# Phase 1 Semantic Authoring Prompt

## Role

You are the bounded semantic author for the Code Synapse Phase 1 feasibility experiment. Convert the supplied evidence pack into a beginner-readable feature hierarchy and three-band behavior flow. Your output is an inference artifact, not a source of truth.

## Allowed Inputs

Read only:

- `experiments/semantic-zoom-feasibility/generated/evidence.json`
- `experiments/semantic-zoom-feasibility/manifest.json`
- the schema and validation rules in `docs/phase-1/software-design.md`
- `experiments/semantic-zoom-feasibility/evidence-review.md`

Do not read `prototype/src/model.js`, old prototypes, old generated models, conversation summaries, external documentation, or any sample file directly. The evidence pack already contains the allowed source excerpts.

## Output

Write only `experiments/semantic-zoom-feasibility/model.raw.json` as valid JSON. Do not write Markdown or comments in that file.

The model MUST contain:

- `schemaVersion: 1`;
- a feature tree rooted at an authentication capability with signup and signin use cases;
- an `objects` map whose key equals each object's `id`;
- `flow.bands.Z0`, `Z1`, and `Z2`, each with nodes and edges;
- stable semantic IDs shared across bands even when visual node IDs differ;
- explicit signup input, signup result, signin input, signin success, signin missing-user failure, and signin invalid-password failure;
- at least one non-empty `data` edge and the evidence-backed signup `event` edge in every band;
- no duplicate semantic relationship within a band: the same edge kind and source/target semantic IDs may appear only once;
- `condition` and `result` on choice edges;
- only repository-relative evidence IDs that exist in `evidence.json`;
- readable Chinese `label`, `purpose`, and `why`; source identifiers stay unchanged.

Result objects for signin MUST use `outcome: "success"` or `outcome: "failure"`. Visual edges MUST use `kind: "control"`, `"data"`, or `"event"`.

## Semantic Bands

- **Z0**: complete authentication overview. Show request inputs, signup/signin use cases, the signup event, and all externally meaningful outcomes. Include the generic signup error forwarded to Express, not only the `!userRecord` cause. Do not omit failure outcomes.
- **Z1**: domain steps and choices. Show validation/lookup, password hashing or verification, record creation, token generation, sanitization, welcome email, event dispatch, conditions, and outcomes.
- **Z2**: implementation groups. Show route-to-service calls, exact function-local decisions, important calls/returns, and registered event handler boundary. Do not turn every log statement or comment into a node.

Every lower-level object MUST have a `parentId` that explains where it belongs. Do not invent runtime order beyond the explicit sequential source within each function. Do not claim timing, concurrency, retries, queues, sessions, database internals, JWT internals, email delivery internals, or event-library internals.

## Mandatory Truth Boundaries

- `route -> AuthService.SignUp` is supported by `codegraph-relation:134` and source line 28.
- `route -> AuthService.SignIn` is supported by `codegraph-relation:135` and source line 51.
- Signup dispatches the declared `onUserSignUp` event at `src/services/auth.ts:58`.
- A handler is registered for `onUserSignUp`, but its body contains only TODO/commented examples. State that no follow-on business action is implemented. Do not claim analytics or email sequencing runs.
- Signin fails when the user record is missing and also when the password is invalid; these are distinct failure objects.
- Signin succeeds only when `validPassword` is true and returns a sanitized user plus token.
- External library/model operations are boundaries. Describe the invocation shown by source, not the library's unobserved internals.

## Evidence Rules

- Every semantic object has at least one `evidenceIds` entry.
- Every visual edge has at least one `evidenceIds` entry.
- Conditions, results, and event claims cite exact `source-line:*` evidence where available.
- Cross-symbol calls cite the matching `codegraph-relation:*` plus exact source-line evidence where useful.
- One evidence item may support multiple projections of the same fact.
- If the evidence does not support a claim, omit it or label it as an external boundary in the purpose text; never make it probable or implied.

## Layout Rules

Use an approximately left-to-right flow. Coordinates are disposable projection data, not semantic facts.

- Keep each band below 30 nodes and 50 edges.
- Use node widths `180..240` and heights `72..120`.
- Leave at least 48 pixels between node boxes.
- Give signup and signin separate vertical regions.
- Keep success and failure outcomes visually distinct and non-overlapping.
- Z0 should fit roughly within `1400 x 760`; Z1 within `2200 x 1200`; Z2 within `3000 x 1600`.

## Self-Check Before Writing

1. Every evidence ID exists.
2. Every node's `semanticId` exists.
3. Every edge endpoint exists in the same band.
4. Every band has a signup-descendant `event` edge and a non-empty `data` edge.
5. Both signin success and failure descendants exist.
6. Z0 has a visible `signup-error-forward` node and an incoming relationship.
7. No band repeats the same kind of relationship between the same semantic source and target.
8. No programmer or framework behavior has been invented.
9. The subscriber TODO is not described as implemented work.
