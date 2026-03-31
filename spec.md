# B-Roll AI Prompt Generator – Prompt Types & Feature Gating

## Current State
- Single prompt type: cinematic B-Roll image prompts
- FormData includes: scene, camera, lighting, atmosphere, style, variations, faceless, etc.
- GenerateForm.tsx builds a static prompt string and sends to OpenAI via makePromptRequestWithSession
- ResultsPanel.tsx shows a numbered list of raw variation strings
- Plan-based batch limits already in place via PLAN_LIMITS from PricingPage.tsx
- Plans: free (3/day), starter (25/day), pro (100/day, batch 5), elite (300/day, batch 10)

## Requested Changes (Diff)

### Add
- `promptType` field to FormData (values: "broll" | "animation" | "avatar")
- Prompt Type selector in GenerateForm UI with 3 options:
  - "B-Roll Prompt" (all plans)
  - "Animation Prompt" (starter+)
  - "Talking Avatar Prompt" (pro+)
- Lock icon (🔒) and disabled state on locked prompt types
- Tooltip/click message: "Upgrade to unlock this feature" when locked option clicked
- Plan badges: "Starter+" on Animation, "Pro Feature" on Talking Avatar
- Prompt-type-specific OpenAI prompt content:
  - B-Roll: scene description, camera angle, lighting, mood, environment details
  - Animation: character action, body movement/timing, camera movement, environment interaction, style
  - Talking Avatar: script (what avatar says), tone, facial expressions, head movement/gestures, camera framing, lighting/background
- Structured output request: each result should include Title, Description, Prompt sections
- ResultsPanel updated to render structured sections (Title / Description / Prompt) per variation if structured format detected; otherwise falls back to plain text

### Modify
- GenerateForm.tsx: add prompt type selector at the top of the form, modify handleGenerate to build type-specific prompt string
- ResultsPanel.tsx: parse and render Title/Description/Prompt sections within each result card
- App.tsx FormData type and DEFAULT_FORM to include promptType

### Remove
- Nothing removed

## Implementation Plan
1. Add `promptType: "broll" | "animation" | "avatar"` to FormData type and DEFAULT_FORM in App.tsx
2. Add PROMPT_TYPE_CONFIG constant mapping prompt type to: label, planRequired, badge label, description
3. Add PromptTypeSelector component in GenerateForm.tsx at top of form with lock states per plan
4. Update handleGenerate to switch on promptType and build a type-specific, structured-output prompt
5. Update ResultsPanel to detect and render Title/Description/Prompt structured sections per card
6. Feature gating: free→broll only, starter→broll+animation, pro/elite→all three
