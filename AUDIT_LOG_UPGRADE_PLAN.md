# Audit Log Page — Upgrade Plan

> **Status:** ✅ Complete  
> **Priority:** P0 — HIPAA Compliance critical  
> **Route:** `/audit-logs`  
> **Sidebar:** `📜 Audit Logs` — gated by `Permission.VIEW_AUDIT_LOGS`  
> **Owner:** Frontend + Backend  

---

## 1. Current-State Audit

### Frontend — `src/pages/AuditLogs.jsx` (395 lines)

| Problem | Impact |
|---------|--------|
| **No `AppShell` wrapper** — page renders outside sidebar layout | Breaks consistent navigation; user can't get back without browser back button |
| **Light-theme CSS** — white backgrounds, `#f5f7fa` gradients, `#1a3a3a` text | Completely clashes with the dark-theme used by Dashboard, Profile, Team, and every other page |
| **Basic HTML table** — 8 columns crammed into one flat `<table>` | Not scannable; IP addresses + UUIDs dominate; no visual hierarchy |
| **No pagination** — fetches 100 logs, no infinite scroll or cursor | Unusable for production audit trails (thousands of entries) |
| **No log-detail drawer** — metadata shown in raw `<pre>` tag inside `<details>` | No structure; can't copy fields; no correlation to other events |
| **Statistics hidden behind toggle** — 4 stat cards only visible after click | Key compliance metrics (PHI access count, security events) should be front-and-center |
| **No real-time streaming** — page is fetch-once on mount | New audit events don't appear until manual reload |
| **No mock data fallback** — only fetches from `/api/audit/logs` | Shows empty spinner in dev when backend has no seeded logs |
| **Export buttons missing from UI** — `handleExport` exists in JS but no buttons rendered | CSV/PDF export code is dead |
| **No user-friendly names** — shows raw UUID for User ID column | Should resolve to user display names or at least email |
| **Filter UX is clunky** — separate "Apply Filters" button, no debounced search | Modern dashboards filter as-you-type |

### Frontend — `src/pages/AuditLogs.css` (498 lines)

| Problem | Impact |
|---------|--------|
| Light-theme palette (`white`, `#f8f9fa`, `#667eea` purple gradient) | Doesn't match app's dark theme (`#0a0e1a`, `#0f1724`, `#1a2332`) |
| 498 lines of CSS-class styles | Will be replaced with inline styles matching Dashboard/Team pattern |

### Backend — `backend/src/modules/audit/audit.controller.ts` (300 lines)

| Endpoint | Status |
|----------|--------|
| `GET /api/audit/logs` | ✅ Works — filters by userId, action, dateRange |
| `GET /api/audit/my-logs` | ✅ Works — current user's logs |
| `GET /api/audit/phi-access` | ✅ Works — PHI access logs |
| `GET /api/audit/verify-integrity` | ✅ Works — blockchain-style chain verification |
| `GET /api/audit/statistics` | ✅ Works — aggregate stats |
| `POST /api/audit/sync` | ✅ Works — offline sync |
| **Missing: Server-sent cursor pagination** | Returns all matching logs in memory — won't scale |
| **Missing: SSE stream for new audit events** | No real-time push |
| **Missing: User name resolution** | Returns raw userId UUIDs — frontend can't resolve |

### Backend — `backend/src/modules/audit/audit.service.ts` (200 lines)

| Method | Status |
|--------|--------|
| `log(data)` | ✅ SHA-256 hash-chained entry creation |
| `verifyIntegrity()` | ✅ Full chain verification |
| `findByUser(userId, limit)` | ✅ Works |
| `findByAction(action, limit)` | ✅ Works |
| `findByDateRange(start, end)` | ✅ Works |
| `findByUserAndDateRange(userId, start, end)` | ✅ Works |
| `findPhiAccess(start, end)` | ⚠️ Ignores date params — returns all PHI logs |
| **Missing: Cursor-based pagination** | All queries return unbounded results |
| **Missing: Full-text search** | No search across resource/metadata fields |
| **Missing: User join** | Doesn't join User entity for name resolution |

### Data Model — `AuditLog` entity

```
id             UUID PK
userId         UUID FK → users
action         AuditAction enum (22 values)
resource       varchar(255)
ipAddress      varchar(45) — encrypted at rest
userAgent      text — encrypted at rest
phiAccessed    boolean  (HIPAA flag)
metadata       text (JSON)
timestamp      datetime
hash           varchar — SHA-256
previousHash   varchar — chain link
integrityVerified  boolean
```

### AuditAction Enum (22 actions)

```
LOGIN, LOGOUT, REGISTRATION, PASSWORD_CHANGE,
EMAIL_VERIFICATION, TWO_FACTOR_ENABLE, TWO_FACTOR_DISABLE,
TWO_FACTOR_VERIFY, TWO_FACTOR_VERIFY_FAILED,
PERMISSION_GRANTED, PERMISSION_DENIED,
SUBSCRIPTION_CHANGE, DATA_EXPORT, DATA_DELETION,
PHI_ACCESS, AI_QUERY, CLINICAL_DATA_ACCESS,
SECURITY_EVENT, PROFILE_UPDATE,
EMERGENCY_ACCESS_SUCCESS, EMERGENCY_ACCESS_FAILED
```

---

## 2. Upgrade Phases

### Phase 1 — Backend Enhancements

**Goal:** Add cursor pagination, user resolution, SSE streaming, and fix PHI date filter.

#### 1a. Fix `findPhiAccess()` to use date params
```
Currently ignores startDate/endDate — apply QueryBuilder date filter.
```

#### 1b. Add cursor-based pagination to `findAll()`
```typescript
// New method signature:
async findAll(filters: {
  userId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  search?: string;       // full-text across resource + metadata
  phiOnly?: boolean;
  cursor?: string;        // last log ID for cursor pagination
  limit?: number;         // default 50
}): Promise<{ logs: AuditLog[]; nextCursor: string | null; total: number }>
```

#### 1c. Join User entity for name resolution
```
Return { ...log, user: { id, email, fullName, role } } via leftJoinAndSelect.
```

#### 1d. Add SSE audit event emission
```
Add EventEmitter to AuditService.
On every log() call → emit 'audit:new' event.
Wire into DashboardController SSE stream as 'audit:new' event type.
```

#### 1e. Update controller
```
GET /api/audit/logs      → use new findAll() with cursor pagination
Response: { data, nextCursor, total, hasMore }
```

**Files to modify:**
- `backend/src/modules/audit/audit.service.ts`
- `backend/src/modules/audit/audit.controller.ts`
- `backend/src/modules/dashboard/dashboard.controller.ts` (SSE wiring)

---

### Phase 2 — Page Redesign (Dark Theme + AppShell)

**Goal:** Rewrite `AuditLogs.jsx` with dark theme, AppShell wrapper, stat banner, and modern layout.

#### Layout

```
┌──────────────────────────────────────────────────────────────┐
│  AppShell (Sidebar + Top Bar)                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │  HEADER                                                  │ │
│ │  📜 Audit Trail          [🔗 Integrity: ✓ VALID]         │ │
│ │  HIPAA-compliant event log    [CSV] [PDF] [⟳ Verify]    │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │  STAT CARDS (always visible)                             │ │
│ │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │ │
│ │  │Total │ │Today │ │ PHI  │ │ Sec  │ │Logins│          │ │
│ │  │ 2,481│ │  37  │ │  12  │ │   3  │ │  89  │          │ │
│ │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │  FILTERS BAR (single row)                                │ │
│ │  [🔍 Search...] [Action ▾] [Severity ▾] [Date Range ▾]  │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │  EVENT TIMELINE / TABLE (switchable views)               │ │
│ │                                                          │ │
│ │  ● 09:42:17  Dr. Sarah Chen  PHI_ACCESS                 │ │
│ │    Patient record #4821 · 10.0.1.42 · ✓ Verified        │ │
│ │                                                          │ │
│ │  ● 09:41:03  System          SECURITY_EVENT              │ │
│ │    Failed login attempt · 192.168.1.100 · ⚠ Critical    │ │
│ │                                                          │ │
│ │  ● 09:38:55  Nurse Kim       LOGIN                       │ │
│ │    Session started · 10.0.1.15 · ✓ Verified              │ │
│ │                                                          │ │
│ │  [Load More ↓]                                           │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─── LOG DETAIL DRAWER (440px, slide from right) ────────┐  │
│  │  ✕ Close                                                │  │
│  │                                                         │  │
│  │  EVENT DETAILS                                          │  │
│  │  ─────────────                                          │  │
│  │  Action:     PHI_ACCESS                                 │  │
│  │  Timestamp:  2026-02-08 09:42:17 UTC                    │  │
│  │  User:       Dr. Sarah Chen (physician)                 │  │
│  │  Resource:   patient:record:4821                        │  │
│  │                                                         │  │
│  │  NETWORK                                                │  │
│  │  ─────────                                              │  │
│  │  IP Address: 10.0.1.42                                  │  │
│  │  User Agent: Chrome 120 / macOS                         │  │
│  │                                                         │  │
│  │  COMPLIANCE                                             │  │
│  │  ──────────                                             │  │
│  │  PHI Accessed:  ✅ Yes                                  │  │
│  │  Integrity:     ✓ Hash verified                         │  │
│  │  Hash:          a3f2c1... (copy)                         │  │
│  │  Previous Hash: 8b1e4d... (copy)                        │  │
│  │                                                         │  │
│  │  METADATA                                               │  │
│  │  ────────                                               │  │
│  │  { patientId: "...", fields: ["vitals","meds"] }        │  │
│  │                                                         │  │
│  │  CHAIN CONTEXT                                          │  │
│  │  ─────────────                                          │  │
│  │  ← Previous event: LOGIN by same user (09:35:12)        │  │
│  │  → Next event: AI_QUERY (09:43:01)                       │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

#### Design Tokens (matching app-wide dark theme)

| Token | Value | Used For |
|-------|-------|----------|
| `--navy-bg` | `#0a0e1a` | Page background |
| `--surface-1` | `#0f1724` | Card backgrounds |
| `--surface-2` | `#1a2332` | Elevated cards, drawer |
| `--panel-border` | `rgba(255,255,255,0.08)` | Card borders |
| `--accent-1` | `#00FF88` | Primary accent (verified, success) |
| `--accent-2` | `#00D4FF` | Secondary accent (info) |
| `--text-color` | `#F8FAFC` | Primary text |
| `--muted-text` | `rgba(255,255,255,0.5)` | Secondary text, labels |

#### Action Severity Colors

| Category | Color | Actions |
|----------|-------|---------|
| **Critical** | `#EF4444` red | `SECURITY_EVENT`, `EMERGENCY_ACCESS_FAILED`, `PERMISSION_DENIED`, `DATA_DELETION` |
| **Warning** | `#F59E0B` amber | `PHI_ACCESS`, `TWO_FACTOR_DISABLE`, `EMERGENCY_ACCESS_SUCCESS`, `DATA_EXPORT` |
| **Auth** | `#3B82F6` blue | `LOGIN`, `LOGOUT`, `REGISTRATION`, `PASSWORD_CHANGE`, `EMAIL_VERIFICATION` |
| **2FA** | `#8B5CF6` purple | `TWO_FACTOR_ENABLE`, `TWO_FACTOR_VERIFY`, `TWO_FACTOR_VERIFY_FAILED` |
| **Clinical** | `#10B981` green | `AI_QUERY`, `CLINICAL_DATA_ACCESS` |
| **Admin** | `#6B7280` gray | `PROFILE_UPDATE`, `PERMISSION_GRANTED`, `SUBSCRIPTION_CHANGE` |

**Files to modify:**
- `src/pages/AuditLogs.jsx` — full rewrite
- `src/pages/AuditLogs.css` — replace with minimal keyframes

---

### Phase 3 — Log Detail Drawer

**Goal:** Slide-in drawer (440px) showing event details, network info, compliance chain, and metadata.

#### Sections

1. **Event Details** — action type with severity badge, timestamp (absolute + relative), user name + role, resource path
2. **Network** — IP address, user agent parsed into readable browser/OS  
3. **Compliance** — PHI accessed flag, integrity verification badge, SHA-256 hash (copyable), previous hash (copyable), chain position  
4. **Metadata** — formatted JSON with syntax highlighting, not raw `<pre>`
5. **Chain Context** — link to previous and next events in the chain for forensic tracing

**Files to modify:**
- `src/pages/AuditLogs.jsx` (drawer built inline, same pattern as Team page)

---

### Phase 4 — Real-Time Streaming

**Goal:** New audit events appear live at the top of the timeline without page refresh.

#### Implementation
1. **Backend:** `AuditService.log()` emits `audit:new` event via EventEmitter
2. **Backend:** `DashboardController.streamUpdates()` listens for `audit:new` and pushes to SSE
3. **Frontend:** `AuditLogs.jsx` subscribes to EventSource, prepends new events with `fadeIn` animation
4. **Live counter:** Stats cards update in real-time as new events arrive

**SSE event shape:**
```json
{
  "type": "audit:new",
  "data": {
    "id": "...",
    "action": "PHI_ACCESS",
    "userId": "...",
    "userName": "Dr. Sarah Chen",
    "resource": "patient:record:4821",
    "timestamp": "2026-02-08T09:42:17Z",
    "phiAccessed": true,
    "integrityVerified": true
  }
}
```

**Files to modify:**
- `backend/src/modules/audit/audit.service.ts`
- `backend/src/modules/dashboard/dashboard.controller.ts`
- `src/pages/AuditLogs.jsx`

---

### Phase 5 — Export & Compliance Toolbar

**Goal:** Surface the dead export code, add visible CSV/PDF buttons, and integrity re-verify button.

#### Toolbar Actions
- **CSV Export** — downloads filtered logs as `audit-logs-YYYY-MM-DD.csv`
- **PDF Export** — generates HIPAA compliance report with header, stats summary, and log table
- **Re-verify Integrity** — triggers chain verification with progress indicator
- **PHI Filter Toggle** — quick filter to show only PHI access events

**Files to modify:**
- `src/pages/AuditLogs.jsx` (toolbar in header section)

---

### Phase 6 — Mock Data & Dev Fallback

**Goal:** Provide realistic mock audit trail for development when backend has no seeded data.

#### Mock Data (25 entries)
- Diverse action types covering all 22 `AuditAction` values
- Mix of users from Team page mock data (Dr. Sarah Chen, Nurse Kim, etc.)
- Realistic timestamps spanning last 48 hours
- Proper hash chain (mock SHA-256 hashes)
- Some PHI access events, some security events
- Metadata with realistic payloads

**Files to modify:**
- `src/pages/AuditLogs.jsx` (mock data + fallback logic)

---

## 3. Data Flow

```
┌─────────────────┐     SSE: audit:new      ┌─────────────────┐
│   AuditService   │──────────────────────────│  AuditLogs.jsx  │
│   .log(entry)    │  EventEmitter → SSE      │                 │
│                  │                          │  EventSource     │
│  findAll(cursor) │◄─── GET /api/audit/logs ─│  subscribes      │
│  + User JOIN     │                          │                 │
│                  │─── { data, nextCursor } ─│  Cursor paging   │
│  verifyIntegrity │◄─── GET verify-integrity ─│  Integrity check │
│  getStatistics   │◄─── GET statistics ──────│  Stat cards      │
└─────────────────┘                          └─────────────────┘
```

---

## 4. Acceptance Criteria

| # | Criterion | Phase |
|---|-----------|-------|
| 1 | Page wrapped in `AppShell` — sidebar visible, navigation works | 2 |
| 2 | Dark theme matches Dashboard/Profile/Team pages exactly | 2 |
| 3 | 5 stat cards always visible (Total, Today, PHI, Security, Logins) | 2 |
| 4 | Inline filter bar with search, action dropdown, severity dropdown, date range | 2 |
| 5 | Timeline view with action-colored severity badges | 2 |
| 6 | Classic table view toggle available | 2 |
| 7 | Log detail drawer slides in from right on row click | 3 |
| 8 | Drawer shows event, network, compliance, metadata, chain context sections | 3 |
| 9 | Hash values copyable with click-to-copy button | 3 |
| 10 | New audit events appear in real-time via SSE without page refresh | 4 |
| 11 | Stats update in real-time as new events arrive | 4 |
| 12 | CSV export downloads filtered logs | 5 |
| 13 | PDF export generates HIPAA compliance report | 5 |
| 14 | Re-verify integrity button with progress indicator | 5 |
| 15 | PHI-only quick filter toggle | 5 |
| 16 | Mock data fallback with 25 diverse entries | 6 |
| 17 | Cursor-based pagination with "Load More" button | 1 |
| 18 | User names resolved (not raw UUIDs) | 1 |
| 19 | `findPhiAccess()` date filter fixed | 1 |
| 20 | All existing 363+ tests still pass | All |
| 21 | Backend builds clean with no TypeScript errors | 1 |

---

## 5. Files Index

| File | Action | Phase |
|------|--------|-------|
| `backend/src/modules/audit/audit.service.ts` | Modify — add `findAll()` with cursor pagination, fix PHI date filter, add EventEmitter | 1, 4 |
| `backend/src/modules/audit/audit.controller.ts` | Modify — update `getLogs()` to use cursor pagination, add user resolution | 1 |
| `backend/src/modules/dashboard/dashboard.controller.ts` | Modify — wire `audit:new` SSE event | 4 |
| `src/pages/AuditLogs.jsx` | Full rewrite — AppShell, dark theme, timeline, drawer, SSE, mock data, exports | 2-6 |
| `src/pages/AuditLogs.css` | Replace — minimal keyframes only, inline styles for everything else | 2 |

---

## 6. Risk Notes

- **PHI data in audit logs** — IP addresses and user agents are encrypted at rest. Frontend must NOT log PHI metadata to browser console.
- **Integrity verification is expensive** — `verifyIntegrity()` reads entire audit chain. For production, consider batched verification.
- **Hash chain breaks on concurrent writes** — `previousHash` lookup is not transactional. Low risk in single-server SQLite but would need locking in production.
- **Export size limits** — CSV/PDF exports of 10,000+ logs can freeze the browser. Consider server-side export for large datasets.
