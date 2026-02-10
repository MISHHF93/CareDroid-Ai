# Settings Page — Upgrade Plan

> **Status:** ✅ Complete  
> **Priority:** P1 — Core User Experience & Security Surface  
> **Route:** `/settings`  
> **Sidebar:** `⚙️ Settings` — no permission gate (accessible to all roles)  
> **Owner:** Frontend + Backend  

---

## 1. Current-State Audit

### Frontend — `src/pages/Settings.jsx` (86 lines)

| Problem | Impact |
|---------|--------|
| **No `AppShell` wrapper** — page renders outside sidebar layout | Breaks navigation; user can't switch pages without browser back |
| **Only 3 settings** — Theme Preference, Notifications toggle, Safety Banner toggle | Missing: session management, data & storage, accessibility, about/version, links to sub-settings |
| **No backend integration** — state is local `useState` only, `handleSave` just shows a toast | Settings are lost on refresh; never persisted to server or localStorage |
| **Uses `Card` / `SettingItem` components** — light-theme-friendly with `var()` fallbacks | Inconsistent with dark-theme inline-style pattern used by all upgraded pages |
| **No loading / saving indicators** — single synchronous `handleSave` | No feedback that anything actually happened |
| **No sections / tabs** — flat list of 3 items | Doesn't scale; no logical grouping (Appearance, Notifications, Security, Data, About) |
| **No navigation to sub-settings** — TwoFactorSetup, BiometricSetup, NotificationPreferences exist as separate routes but have no entry point here | Users must manually navigate to `/settings/2fa`, `/settings/notifications`, `/settings/biometric` |
| **`Link to="/"` labeled "Back to chat"** — hardcoded navigation | Should navigate to previous page or use `useNavigate(-1)` |

### Frontend — Related Sub-Settings Pages

| Page | File | Lines | Status |
|------|------|-------|--------|
| `NotificationPreferences` | `src/pages/NotificationPreferences.jsx` | 8 | Thin wrapper → `src/components/NotificationPreferences.jsx` (320 lines) |
| `TwoFactorSetup` | `src/pages/TwoFactorSetup.jsx` | 407 | Standalone 3-step wizard (generate → verify → backup) |
| `BiometricSetup` | `src/pages/BiometricSetup.jsx` | 380 | Capacitor native plugin integration |
| `ProfileSettings` | `src/pages/ProfileSettings.jsx` | 443 | Full tabbed settings (Personal, Security, Notifications, Privacy) — already has AppShell ✅ |

> **Note:** `ProfileSettings` already covers Security (password + 2FA), Notifications (clinical toggles), and Privacy (consent + data export). The Settings page should complement, not duplicate — it should focus on **app-level** settings (appearance, accessibility, session, data/storage, about/version) and serve as a **hub** that links to the specialized sub-pages.

### Frontend — `SettingItem` Component (21 lines)

| Problem | Impact |
|---------|--------|
| Generic `div` with `var(--panel-border)` border | Falls back to light theme; doesn't match dark inline-style pattern |
| No icon slot, no description truncation, no hover state | Feels static compared to upgraded pages |

### Backend — No Settings Module

| Observation | Impact |
|-------------|--------|
| No `settings.controller.ts` / `settings.service.ts` / `settings.module.ts` | No endpoint to persist or retrieve user app preferences |
| `GET /api/users/profile` returns clinical data, not app preferences | Theme, language, accessibility, session timeout live nowhere on the server |
| `GET /api/notifications/preferences` handles notification prefs only | Separate from general app settings |
| Permissions exist: `CONFIGURE_SYSTEM` (system config), `MANAGE_MFA` | Could gate admin-only settings panels |

### Backend — Existing Related Endpoints

| Module | Key Endpoints | Used By |
|--------|--------------|---------|
| **Users** (`/api/users`) | `GET profile`, `PATCH profile` | ProfileSettings personal tab |
| **Two-Factor** (`/api/two-factor`) | `GET generate`, `POST enable`, `DELETE disable`, `GET status` | TwoFactorSetup, TwoFactorSettings |
| **Notifications** (`/api/notifications`) | `GET preferences`, `PATCH preferences`, `POST toggle-all` | NotificationPreferences (component), ProfileSettings notifications tab |
| **Auth** (`/api/auth`) | `POST change-password`, biometric endpoints | ProfileSettings security tab |

---

## 2. Design Decisions

### What Settings.jsx Should Be

The Settings page is the **app-level preferences hub** — distinct from ProfileSettings (which handles personal/clinical identity). It should contain:

1. **Appearance** — Theme (system/light/dark), compact mode, font size
2. **Accessibility** — High contrast, reduced motion, screen reader hints
3. **Session & Security** — Auto-lock timeout, session info, links to 2FA/Biometric setup
4. **Notifications** — Quick summary + link to full notification preferences
5. **Data & Storage** — Offline data stats, clear cache, export all data
6. **About** — App version, build info, environment, links to docs/changelog

### Architecture Principles

- **AppShell wrapped** with dark-theme inline styles (consistent with Dashboard, Analytics, Team, Audit, Profile)
- **Tab-based layout** — 6 sections accessible via left-side vertical tab bar
- **Backend persistence** — New `settings` module stores user app preferences (theme, accessibility, session timeout, etc.)
- **SSE subscription** — Listen for `settings:sync` events to apply preferences changed on another device
- **Mock data fallback** — Works fully offline with sensible defaults
- **localStorage bridge** — Settings are cached locally for instant apply; synced to backend on save

---

## 3. Upgrade Phases

### Phase 1 — Backend: Settings Module

**Goal:** Create `settings` module with CRUD endpoints for user app preferences.

**Files to create:**
- `backend/src/modules/settings/settings.module.ts`
- `backend/src/modules/settings/settings.controller.ts`
- `backend/src/modules/settings/settings.service.ts`
- `backend/src/modules/settings/entities/user-settings.entity.ts`
- `backend/src/modules/settings/dto/update-settings.dto.ts`

**Entity — `UserSettings`:**
```
id              UUID (PK)
userId          string (unique, indexed)
theme           enum: 'system' | 'light' | 'dark' (default 'system')
compactMode     boolean (default false)
fontSize        enum: 'small' | 'medium' | 'large' (default 'medium')
highContrast    boolean (default false)
reducedMotion   boolean (default false)
screenReader    boolean (default false)
autoLockMinutes number (default 15)
safetyBanner    boolean (default true)
language        string (default 'en')
createdAt       timestamp
updatedAt       timestamp
```

**Controller — `@Controller('settings')`:**

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/settings` | Get current user's app settings (creates defaults if none exist) |
| `PATCH` | `/settings` | Update settings (partial merge) |
| `DELETE` | `/settings/reset` | Reset to defaults |
| `GET` | `/settings/storage` | Get user's data storage stats (offline cache size, event count, etc.) |
| `POST` | `/settings/export` | Queue full data export for the user |

**Service:**
- `getSettings(userId)` — find or create with defaults
- `updateSettings(userId, dto)` — partial merge + emit `settings:sync` via EventEmitter
- `resetSettings(userId)` — delete + recreate defaults
- `getStorageStats(userId)` — query event count, audit log count, last sync time
- `exportUserData(userId)` — placeholder: returns `{ status: 'queued', estimatedTime: '~5 minutes' }`

**Wiring:**
- Add `SettingsModule` to `app.module.ts` imports
- Add `SettingsModule` to `dashboard.module.ts` imports
- Wire `settings:sync` SSE event in `dashboard.controller.ts`

### Phase 2 — Frontend: Settings Hub Rewrite

**Goal:** Complete rewrite of `Settings.jsx` with AppShell, dark theme, 6-section tabbed layout.

**File:** `src/pages/Settings.jsx` — rewrite from 86 lines → ~550 lines

**Structure:**
```
AppShell
└── Settings Container (max-width 900px)
    ├── Header: Title + subtitle + last-synced badge
    ├── Layout: 2-column (sidebar tabs + content)
    │   ├── Tab Bar (vertical, left, 180px)
    │   │   ├── 🎨 Appearance
    │   │   ├── ♿ Accessibility
    │   │   ├── 🔒 Security
    │   │   ├── 🔔 Notifications
    │   │   ├── 💾 Data & Storage
    │   │   └── ℹ️ About
    │   └── Content Panel (flex: 1)
    │       └── [Active Tab Content]
    └── Footer: Save button + Reset to Defaults link
```

**Tab Contents:**

**🎨 Appearance:**
- Theme selector: 3 visual cards (System / Light / Dark) with preview swatches
- Compact mode toggle
- Font size selector: Small / Medium / Large with live preview
- Safety banner toggle

**♿ Accessibility:**
- High contrast mode toggle
- Reduced motion toggle (disables all CSS animations)
- Screen reader optimizations toggle
- Keyboard shortcuts reference (collapsible)

**🔒 Security:**
- Auto-lock timeout slider (5 / 10 / 15 / 30 / 60 min / Never)
- Active sessions display (current device info)
- 2FA status badge + "Manage 2FA" → navigates to `/settings/2fa`
- Biometric status badge + "Manage Biometric" → navigates to `/settings/biometric`
- "Change Password" → navigates to `/profile/settings` with `?tab=security`

**🔔 Notifications:**
- Quick toggle: Master on/off
- Summary: "Email ✅ | SMS ❌ | Push ✅"
- "Manage Notification Preferences" → navigates to `/settings/notifications`
- Test notification button

**💾 Data & Storage:**
- Storage usage bar (events / audit logs / offline cache)
- Clear offline cache button (with confirmation)
- Export all data button
- Last sync timestamp
- Database info (SQLite / storage path)

**ℹ️ About:**
- App name + version + build number
- Environment badge (Development / Production)
- Backend health status (from `/api/health`)
- Uptime counter
- Links: Documentation, Changelog, Support, Privacy Policy
- Open source licenses note

**State Management:**
- `settings` object loaded from `GET /api/settings` with mock fallback
- `dirty` flag — enables Save button only when changes exist
- `saving` / `loading` states
- SSE subscription for `settings:sync` (multi-device sync)
- `localStorage` write-through for instant UI response

### Phase 3 — Frontend: Toggle & Setting Controls

**Goal:** Build reusable inline setting controls that match dark-theme design.

**Inline in Settings.jsx (no separate component file):**

| Control | Description |
|---------|-------------|
| `Toggle` | Animated on/off switch (green/gray) with label + description |
| `SegmentedControl` | Multi-option selector (like Theme: System/Light/Dark) |
| `SliderControl` | Labeled range slider with tick marks |
| `LinkCard` | Setting row that navigates to a sub-page (icon + label + status badge + arrow) |
| `InfoRow` | Read-only key/value display (for About section) |

All controls use inline styles with the established dark-theme pattern.

### Phase 4 — CSS Cleanup

**Goal:** Add minimal CSS for animations only (consistent with other upgraded pages).

**File:** `src/pages/Settings.css` — create ~40 lines

**Keyframes:**
- `@keyframes fadeIn` — content panel transitions
- `@keyframes slideInLeft` — tab content slides
- `@keyframes pulse` — sync indicator
- `@keyframes shimmer` — loading skeleton

**Hover effects, responsive breakpoints, a11y:**
- Tab hover/active states
- Single-column layout below 768px (tabs become horizontal scroll)
- `prefers-reduced-motion` — disable all animations
- Focus-visible outlines for keyboard navigation

### Phase 5 — SSE Integration & Multi-Device Sync

**Goal:** Settings changes on one device propagate to others in real-time.

**Backend:**
- `SettingsService` emits `settings:sync` event with `{ userId, settings }` on every `updateSettings()`
- `DashboardController` subscribes to `settings:sync` in SSE stream, filters by authenticated userId

**Frontend:**
- SSE listener in Settings.jsx: on `settings:sync`, update local state + localStorage
- Visual indicator: "Synced from another device" toast
- Debounce saves: 800ms debounce before sending PATCH to avoid rapid-fire on slider/toggle changes

### Phase 6 — Integration & Polish

**Goal:** Wire everything together, verify routing, test.

**Tasks:**
1. Verify all 5 settings-related routes work: `/settings`, `/settings/notifications`, `/settings/2fa`, `/settings/biometric`, `/profile/settings`
2. Ensure sidebar "Settings" nav item correctly highlights
3. Add `settings:sync` to SSE event types in dashboard controller
4. Backend build clean (`npm run build`)
5. All existing tests pass (363+)
6. Manual smoke test: change theme → verify persisted → change on "another device" (curl) → verify SSE pushes update
7. Restart app on ports 8000 (backend) + 5173 (frontend)

---

## 4. Data Flow

```
┌─────────────┐       PATCH /api/settings        ┌──────────────────┐
│  Settings   │ ──────────────────────────────▶   │  SettingsService │
│   (React)   │                                   │    (NestJS)      │
│             │  ◀─── SSE: settings:sync ──────── │    EventEmitter  │
│  localStorage                                   │    TypeORM       │
│  write-through │                                │    UserSettings  │
└─────────────┘                                   └──────────────────┘
       │                                                   │
       ▼                                                   ▼
  Instant UI                                          SQLite DB
  update (local)                                   (persisted prefs)
```

---

## 5. File Inventory

### Files to Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `backend/src/modules/settings/settings.module.ts` | NestJS module | ~20 |
| `backend/src/modules/settings/settings.controller.ts` | REST endpoints | ~80 |
| `backend/src/modules/settings/settings.service.ts` | Business logic + EventEmitter | ~100 |
| `backend/src/modules/settings/entities/user-settings.entity.ts` | TypeORM entity | ~45 |
| `backend/src/modules/settings/dto/update-settings.dto.ts` | Validation DTO | ~25 |
| `src/pages/Settings.css` | Keyframe animations only | ~40 |

### Files to Rewrite

| File | Current Lines | New Lines | Change |
|------|--------------|-----------|--------|
| `src/pages/Settings.jsx` | 86 | ~550 | Complete rewrite — AppShell, 6-tab hub, dark theme |

### Files to Modify

| File | Change |
|------|--------|
| `backend/src/app.module.ts` | Add `SettingsModule` import |
| `backend/src/modules/dashboard/dashboard.module.ts` | Add `SettingsModule` import |
| `backend/src/modules/dashboard/dashboard.controller.ts` | Wire `settings:sync` SSE event |

### Files Unchanged

| File | Reason |
|------|--------|
| `src/pages/ProfileSettings.jsx` | Already upgraded with AppShell; handles personal/security/notifications/privacy |
| `src/pages/TwoFactorSetup.jsx` | Standalone wizard; linked from Settings Security tab |
| `src/pages/BiometricSetup.jsx` | Standalone setup; linked from Settings Security tab |
| `src/pages/NotificationPreferences.jsx` | Wrapper component; linked from Settings Notifications tab |
| `src/components/SettingItem.jsx` | No longer used by Settings.jsx; kept for backward compat |
| `src/components/TwoFactorSettings.jsx` | Used by ProfileSettings Security tab; unchanged |
| `src/components/NotificationPreferences.jsx` | Used by NotificationPreferences page; unchanged |

---

## 6. Acceptance Criteria

| # | Criterion | Phase |
|---|-----------|-------|
| 1 | `GET /api/settings` returns user preferences or auto-created defaults | 1 |
| 2 | `PATCH /api/settings` persists partial updates to DB | 1 |
| 3 | `DELETE /api/settings/reset` restores default values | 1 |
| 4 | `GET /api/settings/storage` returns data stats | 1 |
| 5 | Settings page renders inside AppShell with sidebar visible | 2 |
| 6 | 6 tabs: Appearance, Accessibility, Security, Notifications, Data & Storage, About | 2 |
| 7 | Theme selector shows 3 visual cards with active highlight | 2 |
| 8 | Compact mode, font size, safety banner toggles work | 2 |
| 9 | High contrast, reduced motion, screen reader toggles work | 2 |
| 10 | Auto-lock timeout slider displays current value | 2 |
| 11 | Security tab shows 2FA/Biometric status + navigation links | 2 |
| 12 | Notifications tab shows master toggle + summary + link to full prefs | 2 |
| 13 | Data & Storage tab shows usage bar + clear cache + export buttons | 2 |
| 14 | About tab shows version, environment, health status, links | 2 |
| 15 | Save button only enabled when `dirty === true` | 2 |
| 16 | Toggle, SegmentedControl, Slider, LinkCard, InfoRow render correctly | 3 |
| 17 | All controls use dark-theme inline styles | 3 |
| 18 | CSS contains only keyframe animations (~40 lines) | 4 |
| 19 | Responsive: single-column below 768px | 4 |
| 20 | `prefers-reduced-motion` disables animations | 4 |
| 21 | SSE `settings:sync` event received and applied live | 5 |
| 22 | Settings debounced (800ms) before PATCH sent | 5 |
| 23 | localStorage write-through for instant UI response | 5 |
| 24 | All 5 settings routes functional | 6 |
| 25 | Backend builds clean | 6 |
| 26 | All existing tests pass (363+) | 6 |
| 27 | App starts successfully on ports 8000 + 5173 | 6 |

---

## 7. Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| New entity may fail TypeORM sync | Use `synchronize: true` in dev; entity follows same patterns as `AnalyticsEvent` |
| Controller path doubling (`/api/api/settings`) | Use `@Controller('settings')` — global prefix `app.setGlobalPrefix('api')` handles `api/` |
| Theme changes affect other pages | Settings only writes to localStorage; actual theme application is out of scope (CSS variables managed globally) |
| SSE event overload | Filter `settings:sync` by userId on backend before sending; debounce saves on frontend |
| Offline mode | Mock fallback data ensures page works without backend; localStorage persistence survives offline |
