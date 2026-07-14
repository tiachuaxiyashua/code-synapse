# Phase 1 Evidence Review

## Pinned Inputs

- Sample: `santiq/bulletproof-nodejs`
- Commit: `7ce1b4690c4e96659cb1ed0d367b08b3ab35a24b`
- CodeGraph: `1.4.1`, schema `8`, extraction version `24`
- Scope: `src/api/routes/auth.ts`, `src/services/auth.ts`, `src/subscribers/events.ts`, `src/subscribers/user.ts`
- Generated local pack: `experiments/semantic-zoom-feasibility/generated/evidence.json` (ignored and reproducible)

## Generated Counts

| Item | Count |
| --- | ---: |
| Scoped source paths | 4 |
| Scoped structural entities | 36 |
| One-hop structural relations | 60 |
| Source evidence records | 310 |
| CodeGraph relation evidence records | 60 |

## Required Fact Checks

| Fact | Structural evidence | Exact source evidence | Result |
| --- | --- | --- | --- |
| Signup route calls `AuthService.SignUp` | `codegraph-relation:134`, resolved by `instance-method` | `src/api/routes/auth.ts:28` | Confirmed |
| Signin route calls `AuthService.SignIn` | `codegraph-relation:135`, resolved by `instance-method` | `src/api/routes/auth.ts:51` | Confirmed |
| Signup input crosses the route boundary | relation 134 reference `authServiceInstance.SignUp`; method signature | `src/api/routes/auth.ts:28`, `src/services/auth.ts:21` | Confirmed |
| Signup hashes the password | CodeGraph retains `AuthService.SignUp` scope; external call is not resolved as an internal target | `src/services/auth.ts:41-42` | Confirmed from source |
| Signup creates the user record | CodeGraph retains `AuthService.SignUp` scope | `src/services/auth.ts:43-48` | Confirmed from source |
| Signup generates a token | `codegraph-relation:191`, `exact-match` | `src/services/auth.ts:50` | Confirmed |
| Signup sends a welcome email | `codegraph-relation:192`, `exact-match` | `src/services/auth.ts:56` | Confirmed |
| Signup dispatches `onUserSignUp` | event name declaration is in the scoped source; no dedicated CodeGraph event edge | `src/services/auth.ts:58`, `src/subscribers/events.ts:3` | Confirmed from source |
| Signup can fail if no user record is created | function-local branch is not supplied by CodeGraph | `src/services/auth.ts:52-53` | Confirmed from source |
| Signup returns a sanitized user and token | function-local return is not supplied by CodeGraph | `src/services/auth.ts:66-69` | Confirmed from source |
| Signin looks up a user by email | function-local external call is not resolved as an internal target | `src/services/auth.ts:77` | Confirmed from source |
| Missing user fails signin | function-local branch is not supplied by CodeGraph | `src/services/auth.ts:78-79` | Confirmed from source |
| Password validity selects success/failure | function-local branch is not supplied by CodeGraph | `src/services/auth.ts:85-99` | Confirmed from source |
| Successful signin generates a token | `codegraph-relation:195`, `exact-match` | `src/services/auth.ts:89` | Confirmed |
| Successful signin returns sanitized user and token | function-local return is not supplied by CodeGraph | `src/services/auth.ts:91-97` | Confirmed from source |
| Invalid password fails signin | function-local branch is not supplied by CodeGraph | `src/services/auth.ts:98-99` | Confirmed from source |

## Important Boundaries

- CodeGraph supplies scoped symbols, calls, import/reference relationships, exact call sites, provider resolution method, and provider confidence. It does not supply the function-local `if`, `throw`, `return`, or event-dispatch semantics used by this experiment.
- `onUserSignUp` is a declared subscriber at `src/subscribers/user.ts:36-37`, but its body contains only TODO/commented examples. The semantic model may say the event is dispatched and a handler is registered; it must not claim that analytics, email sequencing, or another business side effect currently runs.
- `argon2`, database-model methods, Express response behavior, and the event-dispatch library cross the imported source boundary. Their calls can be described from exact invocation evidence, but their internal mechanisms are external boundaries for this sample.
- The route file's async callbacks are not individual CodeGraph function nodes in this index. The route-to-service call edges use the file node as source and exact line/column as the call site. The semantic model must preserve this provider fact rather than inventing callback symbols.

## Review Decision

`M2 evidence gate: passed.` The pack contains the structural and exact source evidence needed for the constrained registration/login semantic pass. No semantic topology has been authored in this review.
