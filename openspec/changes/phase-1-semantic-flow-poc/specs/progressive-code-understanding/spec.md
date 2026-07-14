## ADDED Requirements

### Requirement: P1-1 feature-first navigation
The experiment SHALL provide a standalone feature-tree page where a beginner can select registration or login without knowing symbol names. Selecting a feature SHALL open or focus the standalone flow page and locate the matching semantic region.

#### Scenario: Select feature
- **WHEN** the user selects login in the feature tree
- **THEN** the flow page opens or receives focus and displays the login semantic region as selected

### Requirement: P1-3 global semantic zoom
The flow page SHALL use the mouse wheel to change the representation of the entire canvas between Z0, Z1, and Z2 with hysteresis. It SHALL render only the active band. Zooming SHALL preserve the world location under the pointer, and a selected hidden descendant SHALL be represented by its nearest visible ancestor.

#### Scenario: Reveal progressive detail
- **WHEN** the user wheels from Z0 through the configured thresholds
- **THEN** Z1 and then Z2 replace the complete current representation while preserving understandable parent context

#### Scenario: Return to overview
- **WHEN** the user wheels back below the configured hysteresis thresholds
- **THEN** the flow returns through Z1 to Z0 without rapid band oscillation and without losing the selected semantic context

### Requirement: P1-9 middle-button pan
The flow canvas SHALL start panning only with the middle mouse button and SHALL use pointer capture until release or cancellation. Panning MUST change only camera position, not semantic band, scale, or selected semantic object.

#### Scenario: Pan the flow
- **WHEN** the user holds the middle mouse button and moves the pointer
- **THEN** the canvas position changes while band, scale, and selection remain unchanged

### Requirement: P1-8 nearby hover and pin
Hovering a node or relationship SHALL show a concise explanation near the pointer and hovered object. The popover SHALL remain within the viewport and avoid covering the object when another placement is available. Clicking SHALL pin it; Escape or an outside click SHALL unpin it.

#### Scenario: Inspect and pin explanation
- **WHEN** the user hovers a process step and then clicks it
- **THEN** the explanation follows the pointer before the click, remains fixed afterward, and exposes a working implementation-detail action

### Requirement: P1-6 adjacent source evidence
The implementation-detail action SHALL open an adjacent, read-only source drawer containing the claim, evidence class, repository-relative path, original line numbers, and source excerpt. Closing the drawer MUST preserve the current camera, semantic band, and selection.

#### Scenario: Open and close evidence
- **WHEN** the user opens implementation detail for a selected object and then closes the drawer
- **THEN** the cited source is visible while open and the prior flow state remains unchanged after close

### Requirement: P1-7 independent-page selection sync
The feature and flow views SHALL be independent URLs and SHALL synchronize stable semantic selection without copying canvas coordinates. Unknown messages SHALL not crash either page.

#### Scenario: Synchronize feature selection
- **WHEN** the feature page broadcasts a known semantic ID
- **THEN** the flow page selects the corresponding object or its visible ancestor while retaining its own camera
