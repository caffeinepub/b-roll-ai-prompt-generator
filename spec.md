# B-Roll AI Prompt Generator

## Current State
Authentication (signup/login/logout), session management, and usage tracking are fully implemented. Users have `subscriptionStatus`, `requestsToday`, and `lastRequestDate`. Free users are capped at 5 requests/day with automatic daily reset. Demo user (demo@demo.dm / demo1234) is seeded. No admin role or admin dashboard exists.

## Requested Changes (Diff)

### Add
- `userRoles` Map in backend (email -> "user" | "admin")
- `userEmailList` List in backend for iterating all registered users
- `role` field to `UserPublic` type
- Admin user seed: `medes608@gmail.com`, password `Admin@1234`, role `admin`, subscription `paid`
- Backend admin query: `getAllUsers(sessionToken)` -> `[UserPublic]` (admin-gated)
- Backend admin updates: `adminSetSubscription`, `adminSetRole`, `adminResetUsage`, `adminDeleteUser` (all Bool-returning, admin-gated)
- `AdminDashboard` React component: user table with search, plan/role badges, action buttons per user
- Admin nav link visible only to users with `role === "admin"`

### Modify
- `signUp` to push email to `userEmailList`
- `getCurrentUser` to return `role` field via shared `buildUserPublic` helper
- `UserPublic` Motoko type to include `role : Text`
- `backend.did.d.ts` / `backend.did.js`: add `role` to `UserPublic` IDL, add admin service methods
- `backend.d.ts` / `backend.ts`: add `role` to `UserPublic`, add admin methods to interface and class
- `useAuth.ts`: add `role` to `AuthUser` type
- `App.tsx`: add admin tab in nav (admin-only), render `AdminDashboard` when active

### Remove
- Nothing

## Implementation Plan
1. Update `main.mo` with new types, role helpers, seed data, and admin functions
2. Update `declarations/backend.did.d.ts` and `backend.did.js` with new types and service methods
3. Update `backend.d.ts` and `backend.ts` with new interface and Backend class methods
4. Update `useAuth.ts` to expose `role`
5. Create `AdminDashboard.tsx` with user table, search, and per-user action controls
6. Update `App.tsx` navigation and tab rendering for admin route
