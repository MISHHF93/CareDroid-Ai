# Dashboard Upgrade Plan

> **Date:** February 6, 2026  
> **Status:** ✅ Implemented (Phases 1–5 complete)  
> **Scope:** Dashboard page overhaul — remove redundancies with Sidebar, add missing clinical intelligence features

---

## 1. Redundancy Audit: Dashboard vs Sidebar

### What the Sidebar already provides
| Feature | Sidebar Location | Dashboard Duplicate? |
|---|---|---|
| **Clinical Tools grid** (Drug Checker, Lab Interpreter, Calculators, Protocols, Diagnosis, Procedures) | Sidebar → "Clinical Tools" section with favorites, pinned, recent, all tools, workspace filtering | **YES — full duplicate** |
| **Tool favorites / recently used badges** | Sidebar → ★ Favorites subsection + 🕓 Recent Tools | **YES — duplicate badges on ToolCards** |
| **Tool shortcuts (Ctrl+1…6)** | Sidebar → each tool card shows shortcut | **YES — shown again in dashboard ToolCard** |
| **Notifications bell + unread count** | Sidebar → footer 🔔 with badge | **YES — also in DashboardHeader** |
| **User greeting / profile info** | Sidebar → user avatar, name, role | **Partial — dashboard greeting repeats user name** |
| **Navigation to /tools, /profile, /settings** | Sidebar → nav items | Not duplicated directly |
| **System health indicator** | Sidebar → health dot (green/red) | **YES — also in DashboardHeader date line** |

### Verdict: Remove from Dashboard
1. **"Clinical Tools" grid** — The entire `toolRegistry.map(…)` section with ToolCards. These 6 tool cards are fully accessible from the Sidebar (which has richer UX: favorites, pinning, workspace filtering, recent tools). Removing them frees ~40% of the dashboard viewport for clinical intelligence.
2. **Duplicate notification bell** in DashboardHeader — Sidebar footer already has the notification bell. Keep the dropdown behavior but move it exclusively to the Sidebar or consolidate to one location.
3. **System health dot** in the header date line — Sidebar already shows this. Remove from dashboard header subtitle.

### Keep on Dashboard (not in Sidebar)
- ✅ Stats cards (Critical Patients, Active Patients, Pending Labs, Stable)
- ✅ Activity Feed (live clinical activity stream)
- ✅ Alerts Panel (actionable clinical alerts)
- ✅ Patients section (filterable patient list with expand/collapse)
- ✅ Search bar (patient-specific search)
- ✅ Refresh button
- ✅ "New Patient" and "Emergency" quick-action buttons

---

## 2. Proposed Upgrades

### 2A. Replace Tools Grid → **Shift Handoff / My Workload Panel**
**Why:** The tools grid is redundant. Replace it with a "My Workload" widget showing the logged-in clinician's assigned patients, pending tasks, and upcoming handoffs.

**Features:**
- Tasks due today (labs to review, orders pending sign-off, consult requests)
- Shift timer with upcoming shift-change countdown
- Quick handoff notes: editable panel for outgoing shift summary
- Task completion checkboxes with progress bar

---

### 2B. Add **Clinical Trend Sparklines** to Stat Cards
**Why:** Current stat cards show a single number + optional trend arrow. Adding inline sparkline charts gives a visual 7-day trend at a glance.

**Features:**
- Mini sparkline (last 7 data points) rendered inside each StatCard
- Color-coded: green = improving, red = worsening
- Tooltip on hover showing exact values per day
- Uses existing `stats.trends` data already fetched by `useDashboard`

---

### 2C. Add **Quick Orders Widget**
**Why:** Clinicians frequently need to place common orders (stat labs, vitals checks, medication refills) without navigating away. A compact widget streamlines this.

**Features:**
- Pre-built quick-order templates (Stat CBC, BMP, UA, Vitals q4h, PRN meds)
- One-click order placement with patient selector dropdown
- Recent orders sidebar for re-ordering
- Integration with backend `/api/orders` endpoint

---

### 2D. Add **Team / On-Call Roster Widget**
**Why:** Knowing who's on call for consults, covering attending, and available specialists is critical information that belongs on the dashboard.

**Features:**
- Current on-call roster grouped by specialty
- Click-to-page or click-to-message shortcut
- Status indicators (available, in surgery, off-site)
- Shift schedule for today + tomorrow

---

### 2E. Add **Bed Board / Census Overview**
**Why:** A compact bed board gives an instant visual summary of unit occupancy, which is a core operational metric for clinical teams.

**Features:**
- Grid of beds color-coded by status (occupied/available/cleaning/reserved)
- Hover to see patient name + acuity
- Occupancy percentage bar
- Filterable by unit/floor

---

### 2F. Add **Lab Results Timeline**
**Why:** The "Pending Labs" stat card shows a count, but clinicians need to see which labs are pending and which just resulted. A timeline view for the last 12 hours fills this gap.

**Features:**
- Horizontal timeline showing lab ordered → resulted events
- Critical values highlighted with red markers
- Click to expand and view full result
- Filter by patient or lab type
- Badge for "new results since last view"

---

### 2G. Upgrade **Activity Feed → Unified Command Feed**
**Why:** Current feed shows basic activity items. Upgrade it into a categorized, filterable command feed with action shortcuts.

**Enhancements over current:**
- Category filter tabs (All | Labs | Meds | Vitals | Notes | Imaging)
- Inline action buttons (e.g., "View Result" on a lab activity, "Sign Order" on a pending med)
- Priority pinning: critical items stick to top
- Unread marker for items since last dashboard visit
- Sound/visual flash for new critical items (optional, with mute toggle)

---

### 2H. Upgrade **Alerts Panel → Smart Triage Queue**
**Why:** Current alerts panel shows severity + acknowledge. Upgrade to a triage queue with escalation tracking, timer, and routing.

**Enhancements over current:**
- Auto-escalation timer: show time remaining before auto-escalation
- Route to specialist button (sends page/notification to on-call)
- Grouped by patient (multiple alerts for same patient collapse together)
- SBAR summary auto-generated for each alert cluster
- Resolved alerts archive with audit trail

---

### 2I. Add **Medication Administration Timeline (MAR Preview)**
**Why:** Upcoming medication administrations are high-priority information. A compact MAR preview on the dashboard shows what's due in the next 2 hours.

**Features:**
- Timeline of medications due in next 2 hours across all assigned patients
- Color-coded: overdue (red), due now (yellow), upcoming (green)
- Quick "administered" checkbox
- Click to open full MAR for patient
- Count of overdue meds in a badge

---

### 2J. Add **Clinical Decision Support Banner**
**Why:** Context-aware banners at the top of the dashboard can surface proactive clinical recommendations (e.g., "3 patients due for sepsis screening", "DVT prophylaxis reminder for post-op patients").

**Features:**
- Rotating clinical reminders based on current patient census
- Evidence-based protocol nudges
- Dismissible with "Done" / "Snooze 1hr" / "Not applicable"
- Audit-logged for compliance tracking

---

## 3. Proposed New Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  HEADER: Greeting + Date + Refresh + New Patient + 🚨  │
├─────────────────────────────────────────────────────────┤
│  [Clinical Decision Support Banner]                     │
├────────────┬────────────┬────────────┬──────────────────┤
│  StatCard  │  StatCard  │  StatCard  │  StatCard        │
│  Critical  │  Active    │  Pending   │  Stable          │
│  +sparkline│  +sparkline│  Labs+spark│  +sparkline      │
├────────────┴────────────┴────────────┴──────────────────┤
│                                                         │
│  ┌─ MY WORKLOAD ────────────┬─ QUICK ORDERS ──────────┐ │
│  │ □ Review CBC - Smith     │  [Stat CBC]  [BMP]      │ │
│  │ □ Sign order - Johnson   │  [UA]  [Vitals q4h]     │ │
│  │ □ Consult response       │  Patient: [dropdown]    │ │
│  │ ▓▓▓▓▓▓░░░░ 60% done     │  [Recent Orders]        │ │
│  │ Shift ends in: 3h 22m   │                          │ │
│  └──────────────────────────┴──────────────────────────┘ │
│                                                         │
│  ┌─ COMMAND FEED ───────────┬─ SMART TRIAGE QUEUE ────┐ │
│  │ [All|Labs|Meds|Vitals]   │  🔴 CRITICAL (2)        │ │
│  │ 🧪 CBC resulted - Smith  │  ├─ HR 142 - Room 204   │ │
│  │    [View Result]         │  │  ⏱ Escalates in 4m   │ │
│  │ 💊 Heparin due - Jones   │  │  [Route] [Ack]       │ │
│  │    [Mark Admin'd]        │  ├─ SpO2 88% - Room 112 │ │
│  │ ❤️ BP spike - Davis      │  │  ⏱ Escalates in 12m  │ │
│  │    [View Trend]          │  │  [Route] [Ack]       │ │
│  └──────────────────────────┴──────────────────────────┘ │
│                                                         │
│  ┌─ MAR PREVIEW (next 2h) ──┬─ ON-CALL ROSTER ───────┐ │
│  │ 🔴 Overdue: Metoprolol   │  Cardiology: Dr. Kim 🟢 │ │
│  │ 🟡 Now: Insulin sliding  │  Surgery: Dr. Patel 🟡  │ │
│  │ 🟢 14:00: Vancomycin     │  Nephrology: Dr. Lee 🔴 │ │
│  │ 🟢 14:30: Lasix          │  ICU Attending: Dr. Wu  │ │
│  └──────────────────────────┴──────────────────────────┘ │
│                                                         │
│  ┌─ BED BOARD ──────────────┬─ LAB RESULTS TIMELINE ─┐ │
│  │ ▓▓▓▓▓▓▓░░░ 72% occupied │  ──●──●──◉──○──○──     │ │
│  │ 🟥🟥🟩🟥🟥🟩🟨🟩🟩🟩  │     ↑critical             │ │
│  │ Unit 3A: 8/10 beds      │  [Filter: All | Crit]   │ │
│  └──────────────────────────┴──────────────────────────┘ │
│                                                         │
│  ┌─ PATIENTS (filterable) ──────────────────────────────┐│
│  │ [All] [Critical] [Urgent] [Stable]  🔍 Search...    ││
│  │ ┌─ PatientCard (expandable) ──────────────────────┐  ││
│  │ │  Smith, John | Room 204 | Status: Critical      │  ││
│  │ └────────────────────────────────────────────────────┘││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## 4. Implementation Priority

| Priority | Upgrade | Effort | Impact |
|---|---|---|---|
| **P0** | Remove Clinical Tools grid (redundant with Sidebar) | Small | High — reclaims viewport |
| **P0** | Remove duplicate notification bell & health dot | Small | Medium — cleaner UX |
| **P1** | Add sparklines to StatCards | Medium | High — instant visual trends |
| **P1** | Upgrade Activity Feed → Command Feed with filters + inline actions | Medium | High — actionable feed |
| **P1** | Upgrade Alerts Panel → Smart Triage Queue with escalation timers | Medium | High — clinical safety |
| **P2** | Add My Workload / Shift Panel | Medium | High — task visibility |
| **P2** | Add Quick Orders Widget | Medium | High — workflow speed |
| **P2** | Add MAR Preview (medication timeline) | Medium | High — patient safety |
| **P3** | Add On-Call Roster | Small | Medium — team coordination |
| **P3** | Add Clinical Decision Support Banner | Medium | Medium — proactive care |
| **P3** | Add Bed Board / Census Overview | Medium | Medium — operational awareness |
| **P4** | Add Lab Results Timeline | Large | Medium — lab workflow |

---

## 5. Summary

**Remove (redundant with Sidebar):**
- ❌ Clinical Tools grid (6 ToolCards) — Sidebar has full tool management with favorites, pinning, workspaces, recent
- ❌ Duplicate notification bell in DashboardHeader — Sidebar footer already has it
- ❌ Health status dot in header — Sidebar already shows it

**Add (new clinical intelligence):**
- ✅ Sparkline trends in StatCards
- ✅ My Workload / Shift Handoff panel
- ✅ Quick Orders widget
- ✅ Command Feed (upgraded Activity Feed with filters & inline actions)
- ✅ Smart Triage Queue (upgraded Alerts Panel with escalation timers)
- ✅ MAR Preview (medication timeline)
- ✅ On-Call Roster
- ✅ Bed Board / Census
- ✅ Lab Results Timeline
- ✅ Clinical Decision Support Banner

**Net result:** Dashboard transforms from a "tool launcher + basic feed" into a **clinical command center** focused on actionable intelligence, patient safety, and operational awareness — everything that doesn't belong in a navigation sidebar.
