## ADDED Requirements

### Requirement: P1-8 bounded evidence pack
The experiment SHALL build a bounded evidence pack from the pinned sample commit, CodeGraph SQLite facts, and exact source ranges. Every evidence path SHALL be repository-relative, and the extractor SHALL reject paths outside the sample root, invalid line ranges, a missing database, a mismatched commit, and an unsupported fixed schema.

#### Scenario: Valid evidence extraction
- **WHEN** the pinned sample, expected CodeGraph database, and declared analysis scope are available
- **THEN** the extractor writes an inspectable evidence pack containing repository identity, scoped structural facts, exact source excerpts, and provider references

#### Scenario: Unsafe or stale evidence
- **WHEN** an evidence path escapes the sample root, a source range is invalid, or the sample commit differs from the manifest
- **THEN** extraction exits with an actionable error and does not replace the last validated artifact

### Requirement: P1-2 evidence-backed semantic objects
Every user-facing functional object and relationship in the semantic model MUST cite at least one valid evidence item. AI-authored purpose, rationale, hierarchy, condition, result, input, output, and event descriptions MUST remain separate from raw evidence and MUST NOT invent facts absent from the evidence pack.

#### Scenario: Supported semantic claim
- **WHEN** a semantic object cites valid source or CodeGraph facts within the evidence pack
- **THEN** the validator accepts the claim if all structural and product truth checks also pass

#### Scenario: Unsupported semantic claim
- **WHEN** a functional object or relationship has no evidence or cites an unknown evidence ID
- **THEN** the validator rejects the complete model and identifies the offending semantic ID

### Requirement: P1-3 hierarchical bands
The model SHALL contain Z0, Z1, and Z2 flow bands linked by stable semantic IDs and parent relationships. Z0 SHALL preserve the complete main behavior while aggregating detail; lower bands SHALL add detail without changing the meaning of higher-level conditions, transfers, or results.

#### Scenario: Complete hierarchy
- **WHEN** a valid model is published
- **THEN** every displayed child has a valid parent or aggregation mapping and a user can trace it back to a Z0 region

#### Scenario: Broken hierarchy
- **WHEN** a parent is missing, a hierarchy contains a cycle, a band is missing, or a visual relationship dangles
- **THEN** the validator rejects the model with the relevant IDs

### Requirement: P1-4 deterministic choices and transfers
The semantic model MUST retain the sample's declared success and failure alternatives with readable conditions and results. It MUST include at least one labeled parameter or return transfer and one labeled event transfer. An unbound selector MUST remain unbound rather than being converted to a probability.

#### Scenario: Complete sample truth
- **WHEN** the model represents the registration and login scope
- **THEN** both login outcomes, the registration event path, and non-empty data/event labels are present and evidence-backed

#### Scenario: Missing critical truth
- **WHEN** a required outcome or event is absent, or a data/event relationship has an empty label
- **THEN** the validator rejects the model even if its generic schema is valid
