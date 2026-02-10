# Analytics Dashboard — Upgrade Plan

> **Status:** ✅ Complete  
> **Priority:** P1 — Clinical Intelligence & Operational Visibility  
> **Route:** `/analytics`  
> **Sidebar:** `📊 Analytics` — gated by `Permission.VIEW_ANALYTICS`  
> **Owner:** Frontend + Backend  

---

## 1. Current-State Audit

### Frontend — `src/pages/AnalyticsDashboard.jsx` (294 lines)

| Problem | Impact |
|---------|--------|
| **No `AppShell` wrapper** — page renders outside sidebar layout | Breaks consistent navigation; user can't reach other pages without browser back |
| **No mock data fallback** — only fetches from `/api/analytics/metrics` | Shows empty "0" values / spinner in dev when backend has no seeded events |
| **Only 3 summary cards** — Total Events, Active Clinicians, Top Events | Missing critical clinical metrics: response time, tool accuracy, cost trends, error rate |
| **No date-range picker** — always fetches last 30 days | Users can't narrow to shift, week, or custom range |
| **No real-time streaming** — page is fetch-once on mount | New analytics events don't appear until manual reload |
| **Tool Usage panel is flat bars** — simple horizontal bar chart only | No sparklines, no trend indicators, no time-series visualization |
| **Engagement panel is a static list** — DAU/WAU/MAU as text rows | Should be a mini chart or at least show % change vs prior period |
| **AI Recommendations section is static** — always shows first 3 tools from toolRegistry | No intelligence; doesn't adapt to user behavior; feels like filler |
| **LiveCostDashboard embedded as separate component** — isolated styling, can't share context | Should be integrated into the analytics grid as a cost panel, not a separate island |
| **Export buttons (CSV/PDF) use getExportService()** — fragile dependency that may fail silently | Should use reliable Blob-based CSV; PDF can remain optional |
| **No loading skeleton** — shows "…" text fallbacks | Should have animated skeleton placeholders |
| **No error retry** — single fetch attempt, then shows error message forever | Should have retry button + stale-data fallback |

### Frontend — `src/pages/AnalyticsDashboard.css` (233 lines)

| Problem | Impact |
|---------|--------|
| Uses `var(--panel-background, white)` with white fallbacks | Falls back to light theme when CSS variables aren't set |
| No dark theme overrides or inline-style pattern | Inconsistent with upgraded pages (Dashboard, Profile, Team, Audit) that use inline styles |
| Missing animations for loading, transitions, card reveals | Page feels static compared to other upgraded pages |

### Backend — `analytics.controller.ts` (114 lines)

| Problem | Impact |
|---------|--------|
| Only 1 GET endpoint (`/analytics/metrics`) | Frontend can't request trend data, funnel analytics, or retention metrics |
| No SSE streaming for real-time analytics | Dashboard can't show live event feed |
| Controller route prefix is `@Controller()` (empty) — uses `'analytics/events'` and `'analytics/metrics'` as full paths | Inconsistent with other modules that use `@Controller('api/audit')` pattern |
| `POST health` endpoint misplaced in analytics controller | Should be in a dedicated health module |

### Backend — `analytics.service.ts` (269 lines)

| Capability | Status |
|------------|--------|
| `trackEvent()` — single event | ✅ Working |
| `trackEventsBulk()` — batch ingest | ✅ Working |
| `getEventMetrics()` — DAU/WAU/MAU + top events | ✅ Working |
| `getEventsByUser()` — user-filtered events | ✅ Working, not exposed via controller |
| `getEventsBySession()` — session replay | ✅ Working, not exposed via controller |
| `getFunnelAnalytics()` — multi-step funnel | ✅ Working, not exposed via controller |
| `getRetentionMetrics()` — 30-day cohort retention | ✅ Working, not exposed via controller |
| `cleanupOldEvents()` — 90-day purge | ✅ Working, not exposed via controller |
| **Trend data (hourly/daily aggregation)** | ❌ Missing |
| **Tool performance metrics (avg response time, error rate)** | ❌ Missing |
| **EventEmitter for SSE** | ❌ Missing |

### Related Components

| Component | File | Status |
|-----------|------|--------|
| `LiveCostDashboard` | `src/components/LiveCostDashboard.jsx` (386 lines) | Works standalone; will embed as panel |
| `CostAnalyticsDashboard` | `src/pages/CostAnalyticsDashboard.jsx` (359 lines) | Separate page at `/analytics/costs`; no AppShell |
| `toolRegistry` | `src/data/toolRegistry.js` (144 lines) | 7+ tools with id, icon, name, color, category |
| `analyticsService` | `src/services/analyticsService.js` (197 lines) | Client-side event tracking + batched POST; works |
| `offlineService` | `src/services/offlineService.js` | Dexie-based `getToolResults()` for offline data |
| `AnalyticsEvent` entity | `backend/…/entities/analytics-event.entity.ts` | UUID, event, userId, sessionId, properties, platform, userAgent, createdAt |

---

## 2. Upgrade Phases

### Phase 1 — Backend Enhancements

**Goal:** Expose existing service methods + add trend aggregation + SSE streaming

#### 1a. New Controller Endpoints

```
GET  /api/analytics/metrics          — (existing, keep) aggregate metrics with date-range
GET  /api/analytics/trends           — NEW: hourly/daily event counts for sparklines
GET  /api/analytics/funnel           — NEW: expose getFunnelAnalytics()
GET  /api/analytics/retention        — NEW: expose getRetentionMetrics()
GET  /api/analytics/events/user/:id  — NEW: expose getEventsByUser()
GET  /api/analytics/top-tools        — NEW: top tools by usage count with trend %
POST /api/analytics/events           — (existing, keep) bulk event ingest
```

#### 1b. Service Additions

```typescript
// New method: getTrends()
async getTrends(
  startDate: Date,
  endDate: Date,
  granularity: 'hour' | 'day' = 'day',
): Promise<Array<{ period: string; count: number }>>

// New method: getTopTools()
async getTopTools(
  startDate: Date,
  endDate: Date,
  limit: number = 10,
): Promise<Array<{ tool: string; count: number; trend: number }>>
```

#### 1c. SSE Integration

- Add `EventEmitter` to `AnalyticsService` (same pattern as AuditService)
- Emit `analytics:event` on every `trackEvent()` / `trackEventsBulk()` call
- Wire into `DashboardController.streamUpdates()` SSE stream
- Frontend subscribes for live metric counter updates

#### 1d. Controller Cleanup

- Change `@Controller()` to `@Controller('api/analytics')` for consistency
- Update route paths to relative: `'metrics'`, `'trends'`, `'funnel'`, `'retention'`, `'events'`
- Move `POST health` to its own module or remove (already handled by NestJS health check)

**Exit Criteria:**
- [ ] All new endpoints return valid JSON
- [ ] `npm run build` — clean
- [ ] SSE `analytics:event` fires on new event ingest
- [ ] Route prefix is `api/analytics`

---

### Phase 2 — Page Skeleton & AppShell Wrap

**Goal:** Rebuild the page inside AppShell with dark-theme inline styles, loading skeletons, and error handling

#### 2a. Component Structure

```jsx
// Imports
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, Permission } from '../contexts/UserContext';
import { apiFetch, buildApiUrl } from '../services/apiClient';
import AppShell from '../layout/AppShell';
import './AnalyticsDashboard.css';

// Design tokens — severity/category colors
const CATEGORY_COLORS = {
  diagnostic: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  clinical:   { color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  admin:      { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  ai:         { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  cost:       { color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};
```

#### 2b. State Management

```
metrics        — aggregate metrics from /api/analytics/metrics
trends         — hourly/daily time-series from /api/analytics/trends
topTools       — ranked tool list from /api/analytics/top-tools
funnel         — funnel data from /api/analytics/funnel
retention      — retention curve from /api/analytics/retention
loading        — boolean
error          — string | null
dateRange      — { start: Date, end: Date, preset: '24h'|'7d'|'30d'|'90d'|'custom' }
liveCount      — integer, incremented on SSE analytics:event
selectedTool   — tool detail drawer selection
viewMode       — 'overview' | 'tools' | 'engagement' | 'funnel'
```

#### 2c. Mock Data Fallback

- 30 mock analytics events spanning 7 days
- Mock metrics: totalEvents=2847, uniqueUsers=12, DAU=8, WAU=11, MAU=12
- Mock trends: 7-day daily counts with realistic variance
- Mock top tools: all tools from toolRegistry with mock counts + trend percentages
- Mock funnel: login → tool_access → result_viewed → exported (4-step)
- Mock retention: 30-day decay curve (100% → ~42%)

#### 2d. Loading Skeleton

- Animated shimmer placeholders for each stat card (pulse gradient)
- Skeleton bars for tool usage chart
- Skeleton line for trend sparkline area

**Exit Criteria:**
- [ ] Page renders inside AppShell with sidebar visible
- [ ] Dark theme — no white backgrounds, no light-mode fallbacks
- [ ] Loading skeleton shows while fetching
- [ ] Mock data renders when backend unavailable
- [ ] Error state shows retry button

---

### Phase 3 — Stat Cards & KPI Row

**Goal:** 6 always-visible stat cards with trend indicators

| Card | Metric | Icon | Color | Trend |
|------|--------|------|-------|-------|
| Total Events | `metrics.totalEvents` | 📊 | Blue `#3B82F6` | ▲ +12% vs prior period |
| Active Clinicians | `metrics.dailyActiveUsers` | 👥 | Green `#10B981` | ▲/▼ vs yesterday |
| Tool Invocations | top tools sum | 🧰 | Purple `#8B5CF6` | ▲/▼ vs prior period |
| Avg Response Time | `metrics.avgResponseTime` | ⚡ | Amber `#F59E0B` | ▲ worse / ▼ better |
| Error Rate | `metrics.errorRate` | 🚨 | Red `#EF4444` | ▲ worse / ▼ better |
| Data Exported | export count | 📥 | Cyan `#06B6D4` | count this period |

Each card:
- Icon + label (top)
- Large value (center, 28px bold)
- Trend badge (bottom-right): green ▲ for positive metrics, red ▲ for negative metrics (error rate, response time)
- Subtle colored left border (4px solid, matches card color)

**Exit Criteria:**
- [ ] 6 stat cards always visible in responsive grid
- [ ] Trend arrows show directional change
- [ ] Cards use category colors, not gradient backgrounds

---

### Phase 4 — Trend Chart & Sparklines

**Goal:** Time-series visualization for event volume

#### 4a. Trend Area Chart

- Full-width panel below stat cards
- X-axis: time periods (hourly for 24h, daily for 7d/30d/90d)
- Y-axis: event count
- Filled area chart using SVG `<path>` + `<linearGradient>` (no external chart library)
- Interactive: hover shows tooltip with exact count + date
- Date range selector: preset buttons (24h, 7d, 30d, 90d) + custom date inputs

#### 4b. Tool Sparklines

- In the Top Tools panel, each tool row has a mini sparkline (last 7 days)
- 60px × 20px inline SVG polyline
- Color matches the tool's registry color

**Exit Criteria:**
- [ ] Area chart renders with trend data
- [ ] Date range presets switch between 24h/7d/30d/90d
- [ ] Sparklines appear next to each tool in the tools panel
- [ ] Charts use pure SVG — no chart library dependency

---

### Phase 5 — Tool Usage Panel (Enhanced)

**Goal:** Rich tool analytics with usage bars, sparklines, category grouping, and detail drawer

#### 5a. Tool List

- Each tool row:
  - Tool icon (from toolRegistry) + name
  - Category badge (Diagnostic, Clinical, Admin, etc.)
  - Usage bar (proportional width, colored by tool.color)
  - Count label
  - Trend arrow (▲/▼ vs prior period)
  - Mini sparkline (7-day)
- Sorted by usage count (descending)
- Click row → opens tool detail drawer

#### 5b. Tool Detail Drawer

- 400px slide-in from right (same pattern as AuditLogs drawer)
- Sections:
  - **Header**: Icon, name, category badge, total usage count
  - **Usage Trend**: Full sparkline chart (last 30 days)
  - **Top Users**: List of clinicians using this tool most
  - **Avg Response Time**: for this specific tool
  - **Error Rate**: for this tool
  - **Recent Events**: last 10 invocations with timestamp + user

**Exit Criteria:**
- [ ] Tool rows show icon, bar, count, trend, sparkline
- [ ] Clicking a tool opens detail drawer
- [ ] Drawer shows usage trend + top users + recent events

---

### Phase 6 — Engagement & Retention Panels

**Goal:** DAU/WAU/MAU visualization + retention curve + funnel

#### 6a. Engagement Panel

- 3 metric rows: DAU, WAU, MAU
- Each shows: value, % change vs prior period, small bar proportional to MAU
- Below: "Unique Users" total with user icon

#### 6b. Retention Curve

- Panel title: "30-Day Retention"
- Line chart (SVG) showing retention % over days 1-30
- Shaded area under curve
- Key inflection points labeled (Day 1, Day 7, Day 30)
- Cohort info: "Based on N users from [start date]"

#### 6c. Funnel Visualization

- Panel title: "User Journey Funnel"
- Horizontal funnel bars (widest at top, narrowing):
  - Login → Tool Access → Result Viewed → Data Exported
- Each step shows: count, % of previous step (conversion rate)
- Drop-off percentages between steps

**Exit Criteria:**
- [ ] DAU/WAU/MAU display with trend indicators
- [ ] Retention curve renders as SVG line chart
- [ ] Funnel shows 4-step conversion with drop-off rates

---

### Phase 7 — Real-Time SSE & Live Counter

**Goal:** Live event streaming with visual feedback

#### 7a. SSE Subscription

```javascript
useEffect(() => {
  const url = buildApiUrl('/api/dashboard/stream');
  const es = new EventSource(url, { withCredentials: true });

  es.addEventListener('analytics:event', (e) => {
    const data = JSON.parse(e.data);
    setLiveCount(prev => prev + 1);
    setLiveEvents(prev => [data, ...prev].slice(0, 5));
    // Update running totals in metrics
  });

  return () => es.close();
}, []);
```

#### 7b. Live Activity Feed

- Slim banner below header (same pattern as AuditLogs live feed)
- Pulse dot + "Live" badge
- Shows last 3 events: action + user + timeAgo
- Events fade in with CSS animation

#### 7c. Live Counter Animation

- Stat cards animate value changes (count-up effect)
- Brief green flash when a new event arrives for that metric category

**Exit Criteria:**
- [ ] SSE connects and receives analytics:event messages
- [ ] Live feed banner shows recent events
- [ ] Stat card values animate on update

---

### Phase 8 — Export & Toolbar

**Goal:** CSV export, date range toolbar, view-mode tabs

#### 8a. Header Toolbar

```
[ 📊 Clinical Analytics ] [ 🟢 Live: 2,847 events ]

[ 24h ] [ 7d ] [ 30d ] [ 90d ] [ Custom ▾ ]    [ Overview | Tools | Engagement | Funnel ]    [ 📥 CSV ] [ 🔄 Refresh ]
```

#### 8b. CSV Export

- Generates `analytics-{dateRange}-{timestamp}.csv`
- Columns: Period, Events, Active Users, Top Tool, Error Rate, Response Time
- Blob-based download (no external dependency)

#### 8c. View Mode Tabs

- **Overview** (default): All panels visible in grid layout
- **Tools**: Full-width tool usage panel with detail drawer
- **Engagement**: Engagement + Retention + Funnel panels
- **Funnel**: Full-width funnel visualization with detailed step metrics

**Exit Criteria:**
- [ ] Date range presets switch all data
- [ ] View mode tabs filter visible panels
- [ ] CSV exports with current date range
- [ ] Refresh button re-fetches all data

---

### Phase 9 — CSS Cleanup & Animations

**Goal:** Replace 233-line CSS file with minimal keyframes (all styling inline in JSX)

#### Replace `AnalyticsDashboard.css` with:

```css
/* AnalyticsDashboard — Minimal CSS (all styling inline in JSX) */

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
}

@keyframes countUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0s !important;
    transition-duration: 0s !important;
  }
}
```

**Exit Criteria:**
- [ ] Old 233-line CSS replaced with ~30 lines of keyframes
- [ ] All visual styling lives in inline JSX styles
- [ ] Animations respect `prefers-reduced-motion`

---

## 3. Data Flow

```
┌──────────────────────────────────────────────────────────┐
│  AnalyticsDashboard.jsx (inside AppShell)                │
│                                                          │
│  ┌─ Stat Cards ─────────────────────────────────────┐    │
│  │ Events │ Clinicians │ Tools │ Response │ Errors │ │    │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ Trend Chart (SVG) ──────────────────────────────┐    │
│  │  ▁▂▃▅▇▆▅▃▂▁▂▄▆▇▅▃   (area chart, date-range)   │    │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ Tool Usage ────────┐  ┌─ Engagement ────────────┐    │
│  │ 💊 Drug Check ████░ │  │ DAU: 8   ▲ +2          │    │
│  │ 🧪 Lab Interp ███░░ │  │ WAU: 11  ▲ +3          │    │
│  │ 📊 Calculators ██░░░│  │ MAU: 12  — 0           │    │
│  └─────────────────────┘  └─────────────────────────┘    │
│                                                          │
│  ┌─ Retention Curve ───┐  ┌─ Funnel ────────────────┐    │
│  │    ╲                │  │ ████████████ Login 100%  │    │
│  │     ╲___            │  │ █████████   Access  72%  │    │
│  │         ╲____       │  │ ██████      View    51%  │    │
│  │              ╲___   │  │ ████        Export  34%  │    │
│  └─────────────────────┘  └─────────────────────────┘    │
│                                                          │
│  ┌─ Tool Detail Drawer (400px, slides from right) ──┐    │
│  │  Icon + Name + Category                          │    │
│  │  Usage Trend (30-day chart)                      │    │
│  │  Top Users + Avg Response + Error Rate           │    │
│  │  Recent Events (last 10)                         │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘

Data Sources:
  GET /api/analytics/metrics    → stat cards, engagement
  GET /api/analytics/trends     → area chart, sparklines
  GET /api/analytics/top-tools  → tool usage panel
  GET /api/analytics/funnel     → funnel visualization
  GET /api/analytics/retention  → retention curve
  SSE /api/dashboard/stream     → analytics:event live feed
  MOCK fallback                 → all panels when backend unreachable
```

---

## 4. Acceptance Criteria

| # | Criterion | Phase |
|---|-----------|-------|
| 1 | Page renders inside `AppShell` with sidebar visible and navigable | 2 |
| 2 | Dark-theme inline styles — zero light-mode CSS fallbacks | 2 |
| 3 | Loading skeleton (shimmer) appears on initial fetch | 2 |
| 4 | Mock data renders when backend is unreachable | 2 |
| 5 | Error state shows retry button | 2 |
| 6 | 6 stat cards always visible with trend arrows | 3 |
| 7 | Time-series area chart (SVG) with date-range presets | 4 |
| 8 | Tool sparklines (inline SVG polylines) | 4 |
| 9 | Tool usage rows with icon, bar, count, trend, sparkline | 5 |
| 10 | Tool detail drawer with usage trend, top users, recent events | 5 |
| 11 | DAU/WAU/MAU display with trend indicators | 6 |
| 12 | 30-day retention curve (SVG line chart) | 6 |
| 13 | 4-step funnel with conversion rates | 6 |
| 14 | SSE subscription for `analytics:event` real-time updates | 7 |
| 15 | Live activity feed banner with pulse animation | 7 |
| 16 | Stat card values animate on live update | 7 |
| 17 | CSV export with timestamped filename | 8 |
| 18 | Date range toolbar (24h/7d/30d/90d/custom) | 8 |
| 19 | View mode tabs (Overview/Tools/Engagement/Funnel) | 8 |
| 20 | Old 233-line CSS replaced with ~30-line keyframes | 9 |
| 21 | Backend: `/api/analytics/trends` endpoint returns time-series | 1 |
| 22 | Backend: `/api/analytics/funnel` endpoint returns funnel data | 1 |
| 23 | Backend: `/api/analytics/retention` endpoint returns retention curve | 1 |
| 24 | Backend: `/api/analytics/top-tools` endpoint returns ranked tools | 1 |
| 25 | Backend: SSE `analytics:event` fires on event ingest | 1 |
| 26 | Backend: `npm run build` — clean | 1 |
| 27 | Frontend: `npx vitest run` — 363+ tests pass | 9 |

---

## 5. File Inventory

| File | Action | Phase |
|------|--------|-------|
| `backend/src/modules/analytics/analytics.controller.ts` | Rewrite — add 4 endpoints, fix route prefix | 1 |
| `backend/src/modules/analytics/services/analytics.service.ts` | Extend — getTrends, getTopTools, EventEmitter | 1 |
| `backend/src/modules/dashboard/dashboard.controller.ts` | Modify — wire analytics:event SSE | 1 |
| `backend/src/modules/dashboard/dashboard.module.ts` | Modify — add AnalyticsModule import (if not there) | 1 |
| `src/pages/AnalyticsDashboard.jsx` | Complete rewrite — ~700+ lines | 2-8 |
| `src/pages/AnalyticsDashboard.css` | Replace — ~30 lines of keyframes | 9 |
