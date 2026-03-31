# B-Roll AI Prompt Generator

## Current State
- Admin Debug Mode exists only in ScenePackGenerator — always visible for admins with no toggle, shown below results
- GenerateForm (Single Scene Generator) has no debug mode at all
- No global debug toggle button exists anywhere in the UI
- isAdmin is not passed to GenerateForm or ResultsPanel

## Requested Changes (Diff)

### Add
- Global `debugMode` boolean state in App.tsx (admin-only)
- Debug Mode toggle button in the top nav header (visible only to admins)
- Debug JSON panel in both ScenePackGenerator and GenerateForm flows
- The panel shows a JSON-like preview of the request (model, messages with content) WITHOUT api key or system-level fields
- Panel appears as soon as generate is clicked (before/during loading), at the top of the output area

### Modify
- App.tsx: add `debugMode` state + toggle button in header nav; pass `debugMode` to ScenePackGenerator and GenerateForm
- ScenePackGenerator: remove always-on debug logic, accept `debugMode` prop, show debug panel at top when debugMode is on
- GenerateForm: accept `debugMode` + `isAdmin` props, capture `promptContent` as corePrompt before API call, pass to ResultsPanel
- ResultsPanel: accept `debugMode` + `corePrompt` props, render debug panel at top when debugMode is on

### Remove
- Debug panel hardcoded to always show for admins in ScenePackGenerator (replace with prop-driven toggle)

## Implementation Plan
1. Add `debugMode` state and toggle button in App.tsx header (admin only)
2. Pass `debugMode` and `isAdmin` down to ScenePackGenerator and GenerateForm
3. Update ScenePackGenerator to use `debugMode` prop and show debug panel at top of results with JSON preview
4. Update GenerateForm to capture `promptContent` as `corePrompt`, pass `debugMode` + `corePrompt` to ResultsPanel
5. Update ResultsPanel to render debug panel at top when `debugMode && corePrompt`
6. JSON preview format: `{ model, messages: [{ role: 'user', content: '...' }] }` — no api key, no system prompt
