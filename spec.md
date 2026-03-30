# B-Roll AI Prompt Generator

## Current State
- Four subscription plans: Free (5/day), Starter ($7/30/day), Pro ($17/80/day, batch 3), Elite ($27/150/day, batch 5)
- Backend enforces daily limits via `getDailyLimit()` with `FREE_DAILY_LIMIT = 5`
- Frontend `PLAN_LIMITS` constant in `PricingPage.tsx` mirrors backend limits and drives batch UI in `GenerateForm.tsx`
- Pricing page displays plan cards with current plan label and upgrade/downgrade buttons

## Requested Changes (Diff)

### Add
- Nothing new to add

### Modify
- Backend `FREE_DAILY_LIMIT`: 5 → 3
- Backend `getDailyLimit`: starter 30→25, pro 80→100, elite 150→300
- Frontend `PLAN_LIMITS`: free 5→3, starter 30→25, pro maxBatch 3→5, elite dailyLimit 150→300 and maxBatch 5→10
- Pricing page PLANS data: update displayed request counts, ELITE price $27→$37, batch counts updated (pro: up to 5, elite: up to 10)

### Remove
- Nothing to remove

## Implementation Plan
1. Update `FREE_DAILY_LIMIT` and `getDailyLimit()` in `src/backend/main.mo`
2. Update `PLAN_LIMITS` object in `src/frontend/src/components/PricingPage.tsx`
3. Update `PLANS` array in `PricingPage.tsx`: request counts, elite price ($37), batch descriptions
