# 👥 Team Page — Upgrade Plan

> **Status:** ✅ Complete  
> **Priority:** P1 — Core collaboration feature  
> **Route:** `/team`  
> **Owner:** Frontend + Backend  
> **Completed:** All 6 phases deployed — 363/363 tests passing  

---

## 📋 Current State Audit

### What Exists

| Layer | File | Assessment |
|-------|------|------------|
| **Frontend Page** | `src/pages/team/TeamManagement.jsx` (520 lines) | Basic table: search, sort, edit-role modal, invite modal, delete. Not wrapped in `AppShell`. Hardcoded role colors don't match design system. |
| **Frontend CSS** | `src/pages/team/TeamManagement.css` (626 lines) | Full dark-theme table styles, modal styles, responsive. Functional but dated — no glassmorphism, no animations. |
| **Sidebar Nav** | `src/components/Sidebar.jsx` line 100 | `👥 Team → /team` gated by `Permission.MANAGE_USERS` |
| **Route** | `src/App.jsx` line 191 | `<Route path="/team" element={<TeamManagement />} />` |
| **Backend API** | ❌ **Does not exist** | Frontend calls `GET /api/team/users`, `PUT /api/team/users/:id`, `DELETE /api/team/users/:id`, `POST /api/team/invite` — **none of these endpoints exist.** Page always shows spinner → error. |
| **Backend Users** | `UsersController` | Only has `GET /users/profile` and `PATCH /users/profile` — no list, no admin CRUD |
| **Backend Roster** | `DashboardService.getOnCallRoster()` | Hardcoded 6 clinicians, not connected to User entities |
| **User Entity** | `user.entity.ts` | id, email, role (UserRole enum), isActive, lastLoginAt, lastLoginIp, phone, createdAt |
| **UserProfile Entity** | `user-profile.entity.ts` | fullName, firstName, lastName, institution, specialty, licenseNumber, country, timezone, verified, trustScore, avatarUrl, consent fields |
| **Android** | `TeamScreen.kt` | Basic list of 4 hardcoded members |

### Critical Gaps

1. **No backend team API** — the page is completely broken (always errors)
2. **No AppShell** — page renders without sidebar
3. **No member profiles** — just a flat table, can't view a team member's details
4. **No on-call / shift integration** — dashboard on-call roster is disconnected
5. **No team analytics** — no role distribution, coverage stats, or activity feed
6. **No real-time presence** — can't see who's online/available
7. **No bulk operations** — no multi-select for role changes
8. **Role colors mismatch** — uses `#ff6b6b` for Admin vs Profile's `#F59E0B` gold

---

## 🎯 Upgrade Phases

### Phase 1 — Backend Team API  
> *Priority: P0 — Everything depends on this*

Create `GET /api/team/users` + admin CRUD so the page can load.

**Changes:**
- **`backend/src/modules/users/users.service.ts`** — Add methods:
  - `findAll(filters?: { role?, status?, search? })` — returns all users with profiles, supports filtering and search
  - `updateRole(userId, newRole, adminId)` — changes role + audit log
  - `deactivateUser(userId, adminId)` — soft-delete (sets `isActive = false`)
  - `getTeamStats()` — counts by role, active vs inactive, most recent logins
- **`backend/src/modules/users/users.controller.ts`** — Add endpoints:
  - `GET /api/users` — list all users (requires `MANAGE_USERS`)
  - `PATCH /api/users/:id/role` — change role (requires `MANAGE_USERS`)
  - `DELETE /api/users/:id` — deactivate (requires `MANAGE_USERS`)
  - `GET /api/users/stats` — team stats (requires `MANAGE_USERS`)
- **Frontend `TeamManagement.jsx`** — Update API paths from `/api/team/*` to `/api/users/*`

**Deliverables:**
- [ ] `findAll` with TypeORM query + profile join
- [ ] `updateRole` with audit logging
- [ ] `deactivateUser` (soft delete)
- [ ] `getTeamStats` aggregate query
- [ ] Controller endpoints with guards
- [ ] Frontend API paths updated

---

### Phase 2 — Page Redesign (Hero + Cards Layout)  
> *Priority: P0 — Visual overhaul matching Profile page style*

Replace the flat table with a modern card-based layout wrapped in AppShell.

**Proposed Layout:**
```
┌──────────────────────────────────────────────────────────────────┐
│ AppShell (Sidebar + Content Area)                                │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │  TEAM HEADER                                                 │ │
│ │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐│ │
│ │  │ 👥 Total │ │ 🟢 Online│ │ 🩺 On-Call│ │ + Invite Member  ││ │
│ │  │   12     │ │    8     │ │    3     │ │                  ││ │
│ │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘│ │
│ ├──────────────────────────────────────────────────────────────┤ │
│ │  FILTERS BAR                                                 │ │
│ │  [🔍 Search...    ] [All Roles ▾] [Status ▾] [Grid|List] │ │
│ ├──────────────────────────────────────────────────────────────┤ │
│ │  MEMBER CARDS (Grid View)                                    │ │
│ │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐   │ │
│ │  │ 🔵 Avatar     │ │ 🟢 Avatar     │ │ 🟣 Avatar     │   │ │
│ │  │ Dr. Mitchell  │ │ Nurse Davis   │ │ J. Thompson   │   │ │
│ │  │ Physician     │ │ Nurse         │ │ Student       │   │ │
│ │  │ Critical Care │ │ ICU Floor     │ │ Rotation      │   │ │
│ │  │ ●Available    │ │ ●Busy         │ │ ●Off-shift    │   │ │
│ │  │ ─────────     │ │ ─────────     │ │ ─────────     │   │ │
│ │  │ 📧 ✎ ⋮      │ │ 📧 ✎ ⋮      │ │ 📧 ✎ ⋮      │   │ │
│ │  └────────────────┘ └────────────────┘ └────────────────┘   │ │
│ │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐   │ │
│ │  │ ...more cards  │ │               │ │               │   │ │
│ │  └────────────────┘ └────────────────┘ └────────────────┘   │ │
│ └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**Changes:**
- **`TeamManagement.jsx`** — Full rewrite:
  - Wrap in `AppShell`
  - Stats header: Total members, Online count, On-call count
  - Filter bar: search input, role dropdown, status dropdown, grid/list toggle
  - Grid view: member cards with role-colored avatars (matching `ROLE_STYLES` from Profile)
  - List view: compact table (existing table cleaned up)
  - Role-colored avatars: physician=blue, nurse=green, student=purple, admin=gold
  - Status dot: available/busy/dnd/in-surgery/off-shift (matching Sidebar status system)
  - Quick actions per card: message, edit role, view profile, more (⋮)
- **`TeamManagement.css`** — Update for card grid + glassmorphism

**Deliverables:**
- [ ] AppShell wrapper
- [ ] Stats header with live counts
- [ ] Filter bar (search + role + status + view toggle)
- [ ] Grid view — role-colored member cards  
- [ ] List view — cleaned-up table
- [ ] Role color constants aligned with Profile page
- [ ] Responsive: 3-col → 2-col → 1-col

---

### Phase 3 — Member Detail Drawer  
> *Priority: P1 — Deep view into a team member*

Click a member card → slide-in drawer from the right with full details.

**Drawer Content:**
```
┌──────────────── Member Detail ──────────────────┐
│  ┌──────┐  Dr. Sarah Mitchell                   │
│  │Avatar│  Physician · Critical Care             │
│  │ 88px │  Johns Hopkins Hospital                │
│  └──────┘  ● Available        Trust: ████░ 82%  │
│─────────────────────────────────────────────────│
│  📋 Professional Details                         │
│  License: ●●●●-4521     Specialty: Critical Care│
│  Country: United States  Timezone: EST          │
│  Member Since: Jan 2024                         │
│─────────────────────────────────────────────────│
│  🔐 Role & Permissions                           │
│  Role: [Physician ▾]                             │
│  ✓ Read PHI  ✓ Write Notes  ✓ Prescribe         │
│  ✓ Order Tests  ✓ View Labs  ✗ Manage Users     │
│─────────────────────────────────────────────────│
│  📊 Activity                                     │
│  Last login: 2 hours ago · 10.0.1.42            │
│  Tools used today: Drug Checker (3), Labs (5)   │
│  Patients assigned: 4                           │
│─────────────────────────────────────────────────│
│  📅 Schedule                                     │
│  Current shift: Day (07:00–19:00)               │
│  On-call: Wed, Fri                              │
│  Next off: Saturday                             │
│─────────────────────────────────────────────────│
│  [📧 Message]  [📞 Page]  [🔒 Deactivate]       │
└─────────────────────────────────────────────────┘
```

**Changes:**
- **New: `MemberDetailDrawer` component** inside `TeamManagement.jsx` or standalone
  - Fetches `GET /api/users/:id` for full profile
  - Shows professional details, permissions grid, activity summary
  - Admin actions: change role (dropdown), deactivate, message
  - Smooth slide-in animation from the right
- **Backend**: Add `GET /api/users/:id` endpoint (admin view of any user)

**Deliverables:**
- [ ] Slide-in drawer component with backdrop
- [ ] Professional details section
- [ ] Role & permissions section (with live role dropdown)
- [ ] Activity section (last login, tool usage)
- [ ] Admin action buttons (Message, Page, Deactivate)
- [ ] Backend `GET /api/users/:id` with MANAGE_USERS guard

---

### Phase 4 — On-Call & Shift Integration  
> *Priority: P1 — Connect team to scheduling*

Wire the dashboard's `OnCallRoster` data into the team page and add shift metadata.

**Changes:**
- **`TeamManagement.jsx`** — Add "On-Call Now" filter pill and on-call badge on member cards
- **Backend `DashboardService.getOnCallRoster()`** — Connect to User entities instead of hardcoded stub data
- **Backend** — Add shift fields to UserProfile or new ShiftSchedule entity:
  - `currentShift: 'day' | 'night' | 'off'`
  - `onCallDays: string[]`
  - `shiftStart / shiftEnd`
- **Team stats header** — Show on-call count, next shift change countdown

**Deliverables:**
- [ ] On-call badge on member cards
- [ ] "On-Call" filter option
- [ ] Roster data connected to real users
- [ ] Shift schedule section in member drawer
- [ ] Stats header on-call count

---

### Phase 5 — Real-Time Presence & Team Activity  
> *Priority: P2 — Live collaboration awareness*

Use the existing SSE infrastructure to push team presence updates.

**Changes:**
- **Backend** — Extend SSE event stream with `team:presence` events:
  - When a user logs in/out → broadcast status change
  - When a user changes status (available→busy) → broadcast
  - Emit `{ type: 'team:presence', userId, status, lastSeen }`
- **Frontend** — Subscribe to presence events:
  - Update member cards in real-time (green dot → grey dot)
  - Show "X members online" in stats header with live count
  - "Last seen 5 min ago" on offline members
- **Team Activity Feed** — bottom section of team page:
  - "Dr. Mitchell logged in" (2 min ago)
  - "Nurse Davis changed status to In Surgery" (15 min ago)
  - "Dr. Thompson completed Drug Interaction check" (30 min ago)

**Deliverables:**
- [ ] SSE `team:presence` event type
- [ ] Real-time status dots on member cards
- [ ] Live "online" counter
- [ ] Activity feed component (last 20 events)
- [ ] "Last seen" timestamps for offline members

---

### Phase 6 — Invite & Onboarding Flow  
> *Priority: P2 — Complete the invite workflow*

The current `InviteUserModal` calls a non-existent endpoint. Build the full invite flow.

**Changes:**
- **Backend** — New endpoints:
  - `POST /api/users/invite` — generates invite token, sends email (or mock in dev)
  - `GET /api/users/invitations` — list pending invitations
  - `DELETE /api/users/invitations/:id` — revoke invitation
- **Frontend `InviteUserModal`** — Upgrade:
  - Role selector in invite modal (assign role at invite time)
  - Bulk invite: comma-separated emails or CSV upload
  - Invitation status tracker: pending / accepted / expired
  - Pending invitations section on team page
- **Invite link page** — `/invite/:token` — new user registration from invite

**Deliverables:**
- [ ] Backend invite endpoint with token generation
- [ ] Role assignment at invite time
- [ ] Bulk invite (multi-email)
- [ ] Pending invitations list with revoke
- [ ] Invitation status badges

---

## 📐 Data Flow

```
┌─────────────┐     GET /api/users          ┌──────────────────────┐
│  Team Page   │ ◄────────────────────────── │  UsersController     │
│  (React)     │                             │  @MANAGE_USERS guard │
│              │     PATCH /api/users/:id    │                      │
│  Grid/List   │ ──────────────────────────► │  UsersService        │
│  + Drawer    │                             │  .findAll()          │
│              │     SSE team:presence       │  .updateRole()       │
│  + Activity  │ ◄═══════════════════════════│  .deactivateUser()   │
│              │                             │  .getTeamStats()     │
└─────────────┘                              └──────────┬───────────┘
       │                                                │
       │  Uses:                                         │ TypeORM
       │  • UserContext (current user role/perms)        │
       │  • ROLE_STYLES (shared with Profile)            ▼
       │  • SSE EventSource (shared with Dashboard)  ┌──────────┐
       │                                             │  User    │
       └─────────────────────────────────────────────│  Profile │
                                                     │  Entities│
                                                     └──────────┘
```

---

## 🎨 Design Tokens (Shared with Profile)

| Role | Color | Background | Gradient |
|------|-------|------------|----------|
| Physician | `#3B82F6` | `rgba(59,130,246,0.12)` | `linear-gradient(135deg, #3B82F6, #2563EB)` |
| Nurse | `#10B981` | `rgba(16,185,129,0.12)` | `linear-gradient(135deg, #10B981, #059669)` |
| Student | `#8B5CF6` | `rgba(139,92,246,0.12)` | `linear-gradient(135deg, #8B5CF6, #7C3AED)` |
| Admin | `#F59E0B` | `rgba(245,158,11,0.12)` | `linear-gradient(135deg, #F59E0B, #D97706)` |

| Status | Color | Label |
|--------|-------|-------|
| Available | `#10B981` | Available |
| Busy | `#F59E0B` | Busy |
| Do Not Disturb | `#EF4444` | DND |
| In Surgery | `#F59E0B` | In Surgery |
| Off Shift | `#6B7280` | Off Shift |

---

## 📦 Files to Create / Modify

| Action | File | Description |
|--------|------|-------------|
| Modify | `backend/src/modules/users/users.service.ts` | Add findAll, updateRole, deactivateUser, getTeamStats |
| Modify | `backend/src/modules/users/users.controller.ts` | Add GET /users, PATCH /users/:id/role, DELETE /users/:id, GET /users/stats |
| **Rewrite** | `src/pages/team/TeamManagement.jsx` | Full rewrite — AppShell, cards, filters, drawer |
| **Rewrite** | `src/pages/team/TeamManagement.css` | Card grid, glassmorphism, drawer animation |
| Modify | `backend/src/modules/dashboard/dashboard.service.ts` | Connect on-call roster to User entities |
| Modify | `backend/src/modules/events/events.gateway.ts` (or equivalent SSE) | Add team:presence event type |

---

## ⏱ Estimated Effort

| Phase | Effort | Dependencies |
|-------|--------|-------------|
| Phase 1 — Backend Team API | Medium | None |
| Phase 2 — Page Redesign | Large | Phase 1 |
| Phase 3 — Member Drawer | Medium | Phase 2 |
| Phase 4 — On-Call Integration | Medium | Phase 1, Phase 2 |
| Phase 5 — Real-Time Presence | Medium | Phase 2, SSE infra |
| Phase 6 — Invite Flow | Medium | Phase 1 |

---

## ✅ Acceptance Criteria

- [ ] Team page loads without errors (backend API exists)
- [ ] Page wrapped in AppShell with sidebar visible
- [ ] Stats header shows total / online / on-call counts
- [ ] Member cards with role-colored avatars and status dots
- [ ] Grid ↔ List view toggle
- [ ] Search + filter by role + filter by status
- [ ] Click member → detail drawer slides in
- [ ] Admin can change a member's role from drawer
- [ ] Admin can deactivate a member
- [ ] On-call badge visible on roster members
- [ ] Real-time presence updates via SSE
- [ ] Invite flow sends to backend and tracks pending invites
- [ ] Role colors match Profile page design tokens
- [ ] All existing 363 tests still pass
- [ ] Responsive: works at 1024px, 768px, 480px widths
