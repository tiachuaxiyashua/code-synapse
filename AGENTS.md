# Code Synapse Agent Instructions

## Goal And Core Logic

- Build Code Synapse for non-programmers and weak programmers who need to understand AI-written code from user-facing capabilities down to implementation evidence.
- Present code as progressive, scoped human models: global structure, hierarchical behavior, conditions and results, data exchange, runtime mechanisms, source evidence, and changes.
- Treat every code-declared path as deterministic symbolic behavior. Configuration, input, state, events, and runtime values select or highlight declared paths; they do not create them.
- Keep independent concerns in independent views. Do not collapse architecture, behavior flow, timing, feature location, and code detail into one universal graph or tabbed page.

## Single Source Of Truth

- `docs/design/README.md` is the only canonical entry point for product and technical design. It defines which design documents are normative and their read order.
- Before product design, planning, prototyping, or implementation, read that index and every design document it marks as required for the task.
- Experiment reports, implementation plans, prototypes, screenshots, generated artifacts, and conversation summaries are evidence or work records, not product truth.
- When the user confirms, changes, or rejects a decision, update the canonical design documents in the same task and remove conflicting statements instead of appending another interpretation.
- After design is complete or materially changed, run the `ponytail` skill at `full` intensity before writing or executing an implementation plan, building a prototype, or coding. Apply its YAGNI and reuse/standard-library/native-platform checks, then update the canonical design to remove or defer unnecessary requirements before proceeding.

## Work Rules

- Use repository-relative paths in project files and documentation. Do not write machine-specific absolute project roots into committed or reusable artifacts.
- Prefer established standards and proven open-source renderers for each mechanism. Do not invent a generic diagram notation when an appropriate standard exists.
- Never present an AI inference as source fact. Keep source evidence, current bindings, runtime observations, analysis failures, and external boundaries distinguishable.
