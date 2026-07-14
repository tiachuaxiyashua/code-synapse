# Code Synapse Identity Migration Implementation Plan

> **For agentic workers:** Execute this plan inline and track each checkbox. This workspace is not a Git repository, so commit steps do not apply.

**Goal:** Rename the project identity, persisted artifact namespace, commands, browser coordination keys, and repository folder to `code_synapse` without leaving legacy naming behind.

**Architecture:** Apply one consistent mapping across reusable source files first, then regenerate build output from those sources. Rename paths after content updates so commands retain a valid working directory, and finish with case-insensitive scans over source, hidden files, generated assets, filenames, and the parent directory.

**Tech Stack:** React, Vite, npm, Markdown, static HTML.

---

### Task 1: Update Reusable Project Files

**Files:**
- Rename: `docs/product/code_synapse-decisions.md`
- Modify: `AGENTS.md`
- Modify: `docs/product/code_synapse-decisions.md`
- Modify: `prototype/package.json`
- Modify: `prototype/package-lock.json`
- Modify: `prototype/index.html`
- Modify: `prototype/src/**/*.js`
- Modify: `prototype/src/**/*.jsx`

- [x] Replace the machine-facing project identity with `code_synapse`.
- [x] Replace the human-facing brand with `Code Synapse`.
- [x] Replace the persisted artifact directory with `.code_synapse/`.
- [x] Replace annotation namespaces, Skill names, CLI commands, channel names, and named-window prefixes.
- [x] Rename the canonical decision document and update `AGENTS.md` to point to it.

### Task 2: Update Disposable Design Artifacts

**Files:**
- Modify: `.superpowers/brainstorm/**/content/*.html`
- Modify: `.superpowers/brainstorm/**/state/server-info`

- [x] Replace visible branding, HTML titles, DOM dataset keys, and named-window prefixes.
- [x] Update cached absolute paths in the local server state so they reference the renamed root.

### Task 3: Regenerate Frontend Output

**Files:**
- Regenerate: `prototype/dist/index.html`
- Regenerate: `prototype/dist/assets/*`

- [x] Run `npm run build` from `prototype/`.
- [x] Confirm the Vite build exits successfully.

### Task 4: Rename And Verify The Root

**Files:**
- Rename: repository root to `code_synapse/`

- [x] Rename the project root from its parent directory.
- [x] Scan all non-dependency file contents case-insensitively for the legacy identity and naming variants.
- [x] Scan all project path components for the legacy identity and naming variants.
- [x] Confirm `package.json` and the lockfile use the same package name.
- [x] Run a fresh production build from the renamed root.
