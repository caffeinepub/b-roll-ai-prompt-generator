# B-Roll AI Prompt Generator

## Current State
- Full-stack app with auth, subscription tiers, admin dashboard, per-user OpenAI API key storage.
- Each user stores their own API key (`apiKeysByEmail` map) and must enter it on first load.
- After logout, state is cleared but no forced page reload happens.
- API Key button is visible to all users in the nav.

## Requested Changes (Diff)

### Add
- `systemConfig` map in backend for system-wide settings.
- `adminSetSystemApiKey(sessionToken, key)` - admin-only, stores single system-wide API key.
- `adminGetSystemApiKey(sessionToken)` - admin-only, returns current key value.
- `isSystemApiKeySet()` - public query, returns bool.
- API key management section in AdminDashboard with show/hide and save.
- Hooks: `useAdminSetSystemApiKey`, `useAdminGetSystemApiKey`, `useIsSystemApiKeySet`.

### Modify
- `makePromptRequestWithSession` - use system API key from `systemConfig` instead of per-user `apiKeysByEmail`.
- `logout()` in `useAuth.ts` - add `window.location.reload()` after clearing state to ensure login page shows on refresh.
- API Key button in `App.tsx` nav - restrict to admin users only.
- API Key modal in `App.tsx` - change title/description to indicate it sets the system-wide key for all users.
- Auto-show modal logic - only trigger for admins when system key is not set.

### Remove
- Per-user API key prompt shown to all users on login.

## Implementation Plan
1. Add `systemConfig` Map and three new backend functions.
2. Update `makePromptRequestWithSession` to read from `systemConfig`.
3. Update all binding files (did.d.ts, did.js, backend.d.ts, backend.ts) with new functions.
4. Fix logout in `useAuth.ts` to call `window.location.reload()`.
5. In `App.tsx`: restrict API Key nav button and modal to admin only; update modal copy.
6. In `AdminDashboard.tsx`: add API key card at top with current key (masked), show/hide toggle, and save button.
7. Add hooks in `useQueries.ts` for the three new backend functions.
