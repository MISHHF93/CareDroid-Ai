# Dashboard Mobile-Native Action Plan

> **Date:** February 22, 2026  
> **Status:** Proposed (Execution Ready)  
> **Scope:** Transform dashboard from web-style responsiveness to mobile-native UX behavior

---

## 1) Problem Statement

The dashboard currently **fits** on mobile, but still behaves like a desktop layout compressed into a smaller viewport.

### Current symptoms
- Dense multi-widget rows still feel desktop-first.
- Header/actions consume too much vertical space before clinical content.
- Timeline widgets (especially lab timeline) carry inline desktop affordances.
- Interaction targets are inconsistent in touch ergonomics.
- Information hierarchy is not optimized for quick bedside use.

### Target outcome
A dashboard that behaves like a **native clinical mobile screen**:
- One primary task flow per viewport segment.
- Touch-first controls and spacing.
- Stable, non-overflowing cards.
- Faster “first meaningful data” on open.

---

## 2) UX Principles (Mobile-Native)

1. **Priority First:** Critical alerts + immediate actions appear before secondary analytics.
2. **One-Hand Reachability:** Key actions placed in easy thumb zones.
3. **Touch Ergonomics:** Minimum 44px tap targets and predictable spacing.
4. **Progressive Disclosure:** Advanced details behind expand/tap, not always visible.
5. **Zero Horizontal Drift:** No clipping, no sideways scroll, no badge overflow.
6. **Stable Scrolling:** Single vertical reading flow, minimal nested scroll regions.

---

## 3) Proposed Mobile Information Architecture

## Mobile order (top to bottom)
1. Compact header (greeting + refresh + emergency)
2. Critical banner / triage summary
3. Core stat cards (2-up grid on medium phones, 1-up on narrow phones)
4. Smart triage queue (high-severity first)
5. Lab timeline (mobile compact mode)
6. My workload + quick orders (collapsed by default)
7. Remaining widgets in accordion sections
8. Patient list (search + status chips)

### Desktop behavior remains unchanged
Desktop/tablet-wide layouts keep current multi-column experience. Mobile-native behavior is applied under `max-width: 768px` only.

---

## 4) Execution Phases

## Phase 0 — Baseline & Guardrails (P0)
- Capture baseline screenshots for:
  - Dashboard top section
  - Lab timeline card
  - Patient section controls
- Define mobile acceptance checklist (see Section 7).
- Add temporary debug utility class for overflow tracing during implementation.

**Deliverable:** Baseline visual references + checklist committed.

## Phase 1 — Shell + Header Normalization (P0)
- Reduce dashboard header vertical footprint on mobile.
- Ensure fixed menu/safe-area offsets are consistent across dashboard pages.
- Normalize action button stacking and spacing.

**Deliverable:** Header takes ≤ 25% of first screen height on common phones.

## Phase 2 — Grid-to-Stack Conversion (P0)
- Convert dashboard row composition to mobile stack-first rendering.
- Force all card containers to `min-width: 0` and overflow-safe text wrapping.
- Remove nested horizontal behaviors from child widgets.

**Deliverable:** Zero horizontal scrolling and no clipped badges/labels.

## Phase 3 — Lab Timeline Mobile Compact Mode (P0)
- Replace dense inline meta row with wrapped metadata blocks.
- Keep timeline dots + status + critical markers readable at narrow widths.
- Limit initial detail density; expand panel for full result data.

**Deliverable:** Lab timeline card aligns cleanly on 360px wide viewport.

## Phase 4 — Widget Prioritization + Progressive Disclosure (P1)
- Collapse secondary widgets by default on mobile.
- Show only top-priority patient safety information above the fold.
- Use concise labels and truncate non-critical copy.

**Deliverable:** First screen shows critical signal + immediate action controls.

## Phase 5 — Touch Optimization + Performance (P1)
- Enforce 44px tap target minimum for interactive controls.
- Reduce visual noise (chip density, repeated labels, icon clutter).
- Validate smooth scrolling and interaction latency on Android webview.

**Deliverable:** Stable 60fps-feel scroll on typical mid-range Android devices.

---

## 5) Component-Level Action Items

### `Dashboard.jsx`
- Introduce explicit mobile composition order for widgets.
- Move secondary cards behind collapsed sections on mobile.
- Keep desktop map/layout untouched.

### `Dashboard.css`
- Add mobile-native spacing scale for dashboard content.
- Enforce overflow guards on row children and typography wrappers.
- Remove desktop assumptions in mobile media blocks.

### `DashboardHeader.jsx`
- Add compact mobile variant (reduced padding + concise action grouping).
- Keep emergency action prominent and always reachable.

### `LabTimeline.jsx`
- Implement compact metadata row and robust badge wrapping.
- Ensure no fixed-width assumptions for filters/status chips.
- Keep 3D panel optional/minimized on narrow mobile states if needed.

### `AppShell` / global layout (`index.css`)
- Keep safe-area handling consistent.
- Confirm no shell-level left-margin/padding regressions on mobile.

---

## 6) Technical Constraints

- Preserve existing design tokens and theme primitives.
- Do not introduce new visual system or off-spec components.
- Keep route behavior stable (no new loading transitions).
- Minimize risk: mobile-only overrides should not regress desktop.

---

## 7) Acceptance Criteria (Definition of Done)

A change is complete only if all are true:

1. No horizontal scrolling on dashboard at 360px, 390px, and 430px widths.
2. Lab timeline header, filter, badges, and rows stay aligned at all mobile widths.
3. Dashboard top section does not visually overlap shell/mobile menu.
4. Tap targets are comfortable and non-overlapping.
5. Critical data appears above fold without requiring multiple scrolls.
6. `npm run build` passes with no new warnings tied to dashboard modules.
7. Android real-device check confirms no ghosting/bleed/clipping artifacts.

---

## 8) Verification Plan

### Automated
- Production build: `npm run build`
- Run existing frontend tests relevant to dashboard if present.

### Manual (required)
- Android phone portrait:
  - Open dashboard
  - Validate top section alignment
  - Validate lab timeline alignment
  - Scroll full page for clipping/overlap
- Rotate to landscape and return to portrait; verify layout reflows correctly.

---

## 9) Rollout Plan

1. Implement Phase 1–3 in one PR (high-priority alignment fixes).
2. User visual validation on Android device.
3. Implement Phase 4–5 in follow-up PR (UX refinement + performance polish).
4. Final sign-off with before/after screenshot set.

---

## 10) Immediate Next Step

Start **Phase 1 + Phase 3** together:
- compact mobile header
- final lab timeline compact-mode alignment pass
- verify on Android with screenshot checkpoint
