## ADDED Requirements

### Requirement: P1-10 technical truth gate
The phase SHALL NOT receive a GO result unless there are zero unsupported functional claims, zero missing critical paths, zero incorrect conditions/results/transfers, and zero programmer-authored topology repairs. All measurements and corrections SHALL be recorded against the tested repository and model commits.

#### Scenario: Truth gate fails
- **WHEN** factual review finds an invented step, missing main path, wrong branch condition, wrong transfer, or manually reconstructed topology
- **THEN** the decision is REVISE or STOP and production-foundation work is not authorized

### Requirement: P1-10 beginner comprehension gate
A target user SHALL attempt the defined feature, hierarchy, choice, transfer, and evidence tasks without reading the source first. GO requires correct answers to all core questions.

#### Scenario: Beginner understands the model
- **WHEN** a target user completes the manual test from the feature tree
- **THEN** the record shows whether the user correctly explained the main path, parent-child detail, branch conditions/results, data/event direction, and evidence location

### Requirement: P1-10 interaction comparison gate
The new semantic-zoom experience SHALL be compared with the rejected click-to-drill prototype on context retention, overview/detail movement, nearby comparison, and relationship understanding. GO requires no task to be harder and at least three to be easier.

#### Scenario: Semantic zoom comparison
- **WHEN** the target user completes the same understanding tasks with both experiences
- **THEN** the review records easier/equal/harder for all four criteria and applies the declared threshold

### Requirement: bounded authorization after phase one
A GO result SHALL authorize only the next narrow production validation: one additional diagram grammar and simulated regional loading. It MUST NOT be treated as proof of multi-language support, every diagram type, automatic AI integration, or large-repository scalability.

#### Scenario: Phase receives GO
- **WHEN** all truth, comprehension, and interaction gates pass
- **THEN** the decision record names only the approved next validation and retains all other capabilities as deferred

