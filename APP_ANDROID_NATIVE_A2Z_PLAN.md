# CareDroid A–Z Android Native Migration Plan

> Date: February 22, 2026  
> Branch: main  
> Goal: Make the full app feel Android-native (not desktop-responsive)

---

## A) Scope

This plan covers the entire frontend surface:
- Global shell/layout behavior
- Navigation/sidebar/overlays
- Dashboard and all major pages
- Forms, lists, drawers, modals, charts, and tables
- Android WebView constraints (safe areas, touch targets, overflow)

---

## B) Native-UX Baseline Requirements

Every screen must satisfy:
1. No horizontal scrolling at 360/390/412px widths.
2. Tap targets ≥ 44px and non-overlapping.
3. Safe-area-aware top and bottom spacing.
4. Single-column reading flow on phones unless content demands otherwise.
5. No fixed desktop drawers/modals on mobile; use full-width sheet/drawer patterns.
6. Critical information appears above the fold.
7. Build passes with no new warnings from touched modules.

---

## C) Audit Matrix (A–Z)

### C1. Global foundation
- `src/index.css`
- `src/layout/AppShell.jsx`
- `src/components/Sidebar.css`

### C2. Core pages
- `src/pages/Dashboard.jsx`
- `src/pages/Chat.jsx`
- `src/pages/Profile.jsx`
- `src/pages/Settings.jsx`
- `src/pages/AuditLogs.jsx`
- `src/pages/AnalyticsDashboard.jsx`
- `src/pages/team/TeamManagement.jsx`

### C3. Shared components
- `src/components/dashboard/**`
- `src/components/clinical/**`
- `src/components/ui/**`
- `src/components/tools/**`

### C4. High-risk patterns to remove
- Fixed pixel widths in overlays/panels
- Desktop-only row layouts on mobile
- Non-wrapping header metadata and badges
- Nested scroll regions with clipped content
- Margin-left auto alignment that breaks narrow screens

---

## D) Execution Phases

## Phase 1 (P0): Global mobile foundation
- Normalize safe-area offsets and shell behavior.
- Enforce overflow guards (`min-width: 0`, text wrapping).
- Standardize touch targets and vertical rhythm.

## Phase 2 (P0): Critical workflows
- Dashboard
- Audit logs
- Chat
- Profile/Settings

## Phase 3 (P1): Admin/analytics surfaces
- Team management drawers/modals
- Analytics panels/drawers/charts

## Phase 4 (P1): Shared UI hardening
- Form controls and table/list compaction
- Card/header badge wrapping rules
- Modal/drawer sheet behavior

## Phase 5 (P2): Device validation + polish
- Android portrait + landscape checks
- Keyboard open/close layout stability
- Scroll smoothness and touch ergonomics

---

## E) What’s already completed in this session

- Dashboard mobile alignment pass (container/header/controls).
- Lab timeline mobile wrapping and overflow fixes.
- Team management mobile-native overlay conversion:
  - Full-width member drawer on phone
  - Bottom-sheet invite modal on phone
- Analytics mobile-native pass:
  - Compact page spacing
  - Single-column panel behavior on phone
  - Full-width mobile drawer

---

## F) Remaining Work (prioritized)

### P0 (next)
1. Chat compact mode cleanup (composer, toolrail, message bubbles)
2. Profile and Settings vertical rhythm/touch target normalization
3. App-wide table/list mobile behavior (collapse/stack strategy)

### P1
4. Tool pages and result panels
5. Clinical card components (patient/trend widgets)
6. Modal consistency pass across all pages

### P2
7. Micro-polish: animation reduction on low-power devices
8. Optional accessibility pass for larger text scaling on Android

---

## G) Verification Protocol

For each touched page:
1. Build check: `npm run build`
2. Manual check at 360x800, 390x844, 412x915
3. Validate:
   - no clipping
   - no horizontal drift
   - no overlap with mobile menu/safe areas
   - smooth open/close for drawers/modals

---

## H) Delivery Strategy

- Deliver in small, page-grouped commits/PRs to reduce regression risk.
- Keep desktop behavior intact; mobile-only overrides under `max-width: 768px`.
- Capture before/after screenshots per phase for sign-off.

---

## I) Immediate Next Action

Execute Phase 2 on:
1. Chat
2. Profile
3. Settings

Then run build and perform Android visual verification checkpoint.
