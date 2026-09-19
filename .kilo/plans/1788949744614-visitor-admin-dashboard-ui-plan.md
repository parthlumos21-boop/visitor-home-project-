# Implementation Plan: Visitor & Admin Dashboard UI Enhancements

## Overview
Refine the mobile app UI for the Security dashboard header, Admin total-visits screen, and Visitor total-visits screen with a unified premium card-grid layout including QR codes and details navigation.

> **STATUS:** This plan corrects significant discrepancies found between the original proposal and the actual codebase. Several files referenced do not exist and must be **created**, not modified. See [Discrepancies Summary](#discrepancies-summary).

---

## Discrepancies Summary (vs. original proposal)

| Original Claim | Reality | Impact |
|---|---|---|
| Modify `mobile/app/(admin)/total-visits.tsx` | **File does NOT exist** - must be created | New screen + route registration needed |
| `getAdminVisitorVisits()` API exists | **Does NOT exist** in any service | Use `getSecurityVisits()` from `mobile/services/security.ts` instead |
| Admin total-visits uses existing visit-details screen | `/(visitor)/visit-details/[id].tsx` is **visitor-scoped** (`getMyVisitorVisits()` filters by the logged-in visitor's profile); admin would get empty results | Need a new admin visit-details screen, OR make visit-details role-aware |
| Security visits endpoint includes QR tokens | `/security/visits` does **NOT** include `qrCode` in its Prisma `include` | Use `visit.displayId \|\| visit.id` as QR value (matches existing pattern in `admin/visitors.tsx`) |
| "New Appointment" button needs fixing | Button is labeled **"New"**, already small and right-aligned at `visitor/dashboard.tsx:67-76` | Already satisfied; verify only |
| Visitor total-visits needs QR code integration | Already has QR codes, cards, View Details buttons, loading/empty states at `visitor/total-visits.tsx` | Upgrade styling only (card-grid, glass-morphism) |
| Run `npm run lint` | **No lint script** in mobile/package.json | Use `npx tsc --noEmit` for type checking only |

---

## Decision: Data Source for Admin Total Visits

The backend route `/security/visits` (routes/security.ts:20) is protected by `authenticate` only (no `requireRole` restriction), and the route file comment at line 18 states: *"Protected dashboard and listing routes for SECURITY/ADMIN"*. This means **admin users can call this endpoint**. The mobile service wrapper `getSecurityVisits(filter?)` already exists at `mobile/services/security.ts:48-51`.

**Decision:** Admin total-visits will use `getSecurityVisits` from the security service. No backend API changes required.

**QR code value:** The security visits response does NOT include the `qrCode` relation (only `visitor` and `host`). However, `displayId` IS returned (it's a field on the Visit model, schema.prisma:46). Use `visit.displayId || visit.id` as the QR value, matching the existing pattern in `admin/visitors.tsx:94`.

---

## Decision: Admin Visit-Details Navigation

The existing `/(visitor)/visit-details/[id].tsx` fetches data via `getMyVisitorVisits()` (no filter = 'all'), which returns only visits belonging to the authenticated visitor's profile. An admin navigating to this screen with an arbitrary visit ID would get "Details Not Found" because the admin has no visitor profile linked to that visit.

**Decision:** Create a new `mobile/app/(admin)/visit-details/[id].tsx` that fetches visits via `getSecurityVisits()` and finds the matching visit by ID. Reuse the same UI components and layout patterns from the visitor version. Register the route in `admin/_layout.tsx`.

---

## Task List

### Task 1: Security Dashboard Header Cleanup
- **[MODIFY]** `mobile/app/(security)/dashboard.tsx`
  - Remove the `TouchableOpacity` containing `ArrowLeft` (lines 50-53).
  - Remove the inner `flex-row items-center` wrapper around the back-button + title.
  - Keep only `Text("Security Dashboard")` directly in the left side of the outer `flex-row justify-between items-center` container.
  - Result: header shows title left-aligned, Bell + LogOut icons right-aligned, no back button.

### Task 2: Register New Routes in Admin Layout
- **[MODIFY]** `mobile/app/(admin)/_layout.tsx`
  - Add hidden route for `total-visits` (set `href: null` so it doesn't appear in tab bar).
  - Add hidden route for `visit-details/[id]` (set `href: null`).
  - This enables deep-linking to these screens from the dashboard and total-visits cards.

### Task 3: Create Admin Total Visits Screen
- **[CREATE]** `mobile/app/(admin)/total-visits.tsx`
  - Import `getSecurityVisits` from `../../services/security`.
  - Import `QRCode` from `react-native-qrcode-svg`.
  - State: `visits`, `loading`, `error`.
  - Fetch visits on mount: `await getSecurityVisits()` (returns all visits, no filter = no query params).
  - Header: same pattern as `admin/visitors.tsx` (solid white bar, title, optional back button).
  - Card grid layout:
    - Each card: visitor name, company, host name, purpose, scheduled date/time.
    - QR code thumbnail (value: `visit.displayId || visit.id`), size ~92px.
    - **"View All Details"** button navigating to `/(admin)/visit-details/${visit.id}`.
    - Premium styling: pseudo-glass card (`bg-white/70`, `border border-white/30`, `shadow-md`), tap animation (`activeOpacity={0.85}`).
  - Loading state: ActivityIndicator + "Loading..." text.
  - Empty state: "No visits found." centered.
  - Error banner: red border box with error message + Retry button.
  - All text wrapped in `<Text>` components.
  - **Optional secondary change:** Update the admin dashboard "Total Visits" card navigation from `/(admin)/visitors` to `/(admin)/total-visits` (requires modifying `admin/dashboard.tsx` cards array at line 87). Left as optional — user to decide.

### Task 4: Create Admin Visit Details Screen
- **[CREATE]** `mobile/app/(admin)/visit-details/[id].tsx`
  - Mirror the layout of `/(visitor)/visit-details/[id].tsx` (ViewShot for QR sharing, details sections).
  - Fetch: `await getSecurityVisits()`, then `data.find(v => v.id === id)`.
  - QR value: `visit.displayId || visit.id`.
  - Header with back button navigating to `/(admin)/total-visits`.
  - All existing field display logic (visitor name, phone, host, purpose, schedule).
  - Done button at bottom.

### Task 5: Upgrade Visitor Total Visits to Premium Card Design
- **[MODIFY]** `mobile/app/(visitor)/total-visits.tsx`
  - Existing code already has: QRCode integration, cards, View Details button, loading/empty states (lines 58-61, 63-133).
  - Apply premium visual upgrade to match Admin screen:
    - Pseudo-glass card: `bg-white/70`, `border border-white/30`, `shadow-md`.
    - `activeOpacity={0.85}` on card tap.
    - Consistent card layout with Admin version (QR thumb on right, details on left).
  - **Verify** all text is wrapped in `<Text>` (already the case in existing code; confirm no regressions).
  - The existing "View Details" button (line 125-131) already navigates to `/(visitor)/visit-details/${visit.id}` which exists. No change needed to navigation.

### Task 6: Verify "New" Button (No Change Needed)
- **[VERIFY]** `mobile/app/(visitor)/dashboard.tsx` lines 67-76
  - Already a small, right-aligned button (`items-end` container, `px-3 py-2`, `text-sm`).
  - Labeled "New" (not "New Appointment") and navigates to `/(visitor)/new-registration`.
  - **No change required.** Mark as verified.

---

## Technical Constraints

- **No backend API changes** - all data comes from existing endpoints (`/security/visits`, `/visitors/my-visits`).
- **Dependencies already present**: `react-native-qrcode-svg` (^6.3.21), `react-native-view-shot` (^5.1.0), `expo-sharing` (~57.0.18) - confirmed in `mobile/package.json`.
- **Tailwind/Nativewind** is the CSS-in-JS solution used throughout the app.
- **Expo Router** deep-linking pattern: files in `app/(group)/path.tsx` become routes.
- **No lint script** exists; type checking via `npx tsc --noEmit` in the mobile workspace.

---

## TS7022 Error: `createSecurityGuard` (pre-existing, stale)

**Error:** `'createSecurityGuard' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer. [security.ts#L19]`

**Investigation result:** The error is **stale**. Analysis:
- Import chain `security.ts → api.ts → {authStore.ts, activityLogger.ts, apiConfig.ts}` has **no circular dependency**.
- Current `createSecurityGuard` declaration (security.ts:20) already has explicit type annotations (`data: Partial<SecurityGuard>`, return `Promise<{ id: string; message: string }>`).
- No barrel/index files in `mobile/services/` that could create re-export cycles.

**Resolution:** Restart the Metro/TypeScript dev server (process 40288) to clear stale type cache. If the error persists after restart, verify `axios` types are resolved in `node_modules`. No code change is needed.

---

## Verification Plan

### Automated Checks
1. **TypeScript:** Run `npx tsc --noEmit` from the `mobile/` directory. Fix any type errors.
   - **Note:** No `npm run lint` or `npm run typecheck` script exists in the project.
2. **Metro bundler:** Confirm no import/syntax errors by checking the dev server starts.

### Manual Checks
1. **Security Dashboard** (`/(security)/dashboard`):
   - Header shows only "Security Dashboard" title on the left.
   - No back-arrow (ArrowLeft) visible.
   - Bell and LogOut icons on the right.
   - Cards and scan button still function.
2. **Admin Total Visits** (`/(admin)/total-visits`):
   - Visits load from `/security/visits` endpoint.
   - Each card shows visitor name, company, host, purpose, date/time.
   - QR code thumbnail renders in each card.
   - "View All Details" button navigates to `/(admin)/visit-details/[id]`.
   - Loading, empty, and error states all render correctly.
3. **Admin Visit Details** (`/(admin)/visit-details/[id]`):
   - Visit data loads and displays correctly.
   - QR code renders and can be downloaded/shared.
   - Back button returns to total-visits.
4. **Visitor Total Visits** (`/(visitor)/total-visits`):
    - Card grid matches Admin design (pseudo-glass styling, shadow, tap animation).
   - QR codes render correctly.
   - "View Details" navigates to `/(visitor)/visit-details/[id]`.
5. **New Button** (`/(visitor)/dashboard`):
   - Button is small, right-aligned, opens new-registration screen.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Admin `getSecurityVisits` returns max 100 visits (backend `take: 100`) | Acceptable for initial release; pagination can be added later |
| `/security/visits` does not return QR token | Use `displayId` as QR value (fallback to `visit.id`); consistent with existing `admin/visitors.tsx` pattern |
| Admin visit-details shares no code with visitor visit-details | Intentional separation; visitor version is scoped to own visits, admin version to all |
| No TypeScript/lint scripts configured | Use `npx tsc --noEmit` manually; document in AGENTS.md |

---

## Notes & Assumptions

<!-- Process 40288: The original plan references "Validate these changes via the running node terminal (process 40288)".
     This likely refers to a running Metro/Expo dev server process on port 8082 (per mobile/package.json start script).
     Validation will be done by checking the Metro bundler output for errors after code changes. If Process 40288
     is something else, it should be clarified. -->

<!-- Glass-morphism: Nativewind v4 is used. Pseudo-glass approach chosen:
     `bg-white/70` + `border border-white/30` + `shadow` + `backdrop-blur` (if supported).
     No additional libraries needed; consistent with existing card styles in the codebase. -->

<!-- Admin dashboard "Total Visits" card (admin/dashboard.tsx:87) currently navigates to /admin/visitors.
     Task 3 includes an OPTIONAL secondary change to update this to /admin/total-visits instead.
     This is marked optional — the admin visitors screen remains accessible via the Visitors tab. -->

---

## Files Affected

| File | Action |
|---|---|
| `mobile/app/(security)/dashboard.tsx` | MODIFY - remove back button |
| `mobile/app/(admin)/_layout.tsx` | MODIFY - register `total-visits` and `visit-details/[id]` routes |
| `mobile/app/(admin)/total-visits.tsx` | CREATE - new admin visits list screen |
| `mobile/app/(admin)/visit-details/[id].tsx` | CREATE - new admin visit details screen |
| `mobile/app/(visitor)/total-visits.tsx` | MODIFY - premium card styling upgrade |
| `mobile/app/(visitor)/dashboard.tsx` | VERIFY - "New" button (no change needed) |
| `mobile/app/(admin)/dashboard.tsx` | OPTIONAL - update "Total Visits" card navigation |
| `mobile/services/security.ts` | VERIFY - `getSecurityVisits` already exists, no change needed |
