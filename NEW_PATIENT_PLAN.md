# New Patient Feature — Implementation Plan

> **Goal:** Replace the placeholder "+ New Patient" button with a full patient intake flow — a modal quick-add from the dashboard, and a dedicated full-page form accessible from the modal or direct navigation.

---

## Current State

| Layer | What exists | Gap |
|-------|-------------|-----|
| **UI Button** | `DashboardHeader` renders `+ New Patient` → calls `handleNewPatient` | Navigates to `/chat` as a placeholder — no form |
| **Frontend Service** | `dashboardService.getCriticalPatients(filters)` (read-only) | No `createPatient()` method |
| **Backend Controller** | `GET /api/patients`, `GET /api/patients/critical` | No `POST /api/patients` endpoint |
| **Backend Service** | `PatientService.getPatients()`, `.getCriticalPatients()` | No `createPatient()` method |
| **DTO** | `PatientQueryDto`, `PatientResponseDto` | No `CreatePatientDto` |
| **Entity** | `Patient` entity with 12 columns (name, age, gender, room, bed, status, admittingDiagnosis, vitals, alerts, medications) | Complete — no schema changes needed |
| **Modal pattern** | `WorkspaceCreationModal` (overlay + content + header/body/footer) | Reusable pattern to follow |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard Page                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  + New Patient  →  opens NewPatientModal              │  │
│  │                     (quick-add: name, age, gender,    │  │
│  │                      status, room, bed, diagnosis)    │  │
│  │                                                       │  │
│  │  [Save]  → POST /api/patients → refresh dashboard     │  │
│  │  [Open Full Form] → navigate /patients/new            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  /patients/new  — Full Patient Intake Page                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Demographics · Vitals · Medications · Alerts ·       │  │
│  │  Admitting Diagnosis                                  │  │
│  │  [Save Patient] → POST /api/patients → /dashboard     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Phases

### Phase 1 — Backend CRUD Endpoint
**Files:** 3 modified, 1 new

| # | Task | File | Details |
|---|------|------|---------|
| 1.1 | Create `CreatePatientDto` | `backend/src/modules/patients/dto/create-patient.dto.ts` | Validated DTO with `@IsString`, `@IsNumber`, `@IsOptional` decorators. Fields: `name` (required), `age` (required), `gender` (required), `status` (optional, default `stable`), `room`, `bed`, `admittingDiagnosis`, `vitals`, `alerts`, `medications` |
| 1.2 | Add `createPatient()` to service | `backend/src/modules/patients/patient.service.ts` | Accept `CreatePatientDto`, insert via TypeORM repository, return saved entity |
| 1.3 | Add `POST /api/patients` endpoint | `backend/src/modules/patients/patient.controller.ts` | `@Post()` with `@Body() dto: CreatePatientDto`, call service, return 201 + patient. Add Swagger decorators |
| 1.4 | Add `GET /api/patients/:id` endpoint | `backend/src/modules/patients/patient.controller.ts` | `@Get(':id')` to fetch single patient by UUID — needed for post-creation redirect |

**Validation rules:**
- `name`: required, string, 2-120 chars
- `age`: required, integer, 0-150
- `gender`: required, string, max 32
- `status`: optional enum (`critical | urgent | moderate | stable | discharged`), default `stable`
- `room`: optional, max 20
- `bed`: optional, max 20
- `admittingDiagnosis`: optional, max 400
- `vitals`: optional JSON object
- `alerts`: optional JSON array
- `medications`: optional string array

---

### Phase 2 — Frontend Service & Hook
**Files:** 2 modified

| # | Task | File | Details |
|---|------|------|---------|
| 2.1 | Add `createPatient(data)` | `src/services/dashboardService.js` | `POST /api/patients` with JSON body, return created patient |
| 2.2 | Expose `createPatient` in hook | `src/hooks/useDashboard.js` | Add `createPatient` async method that calls service, then triggers patient list refresh on success |

---

### Phase 3 — New Patient Modal (Dashboard Pop-up)
**Files:** 3 new, 1 modified

| # | Task | File | Details |
|---|------|------|---------|
| 3.1 | Create modal component | `src/components/dashboard/NewPatientModal.jsx` | Overlay modal following `WorkspaceCreationModal` pattern. Quick-add form with 7 fields (name, age, gender, status, room, bed, diagnosis). Submit → `createPatient()` → close + refresh. "Open Full Form" link → navigate `/patients/new` |
| 3.2 | Create modal CSS | `src/components/dashboard/NewPatientModal.css` | Dark theme styling consistent with design system tokens. Overlay backdrop, centered content card, form grid, validation error styling, responsive breakpoints |
| 3.3 | Wire modal into Dashboard | `src/pages/Dashboard.jsx` | Add `showNewPatient` state, swap `handleNewPatient` to toggle modal, render `<NewPatientModal>` conditionally. On save success: close modal, refresh dashboard data |
| 3.4 | Form validation | `src/components/dashboard/NewPatientModal.jsx` | Client-side: required fields highlighted, age range check, inline error messages. Disable submit while saving |

**Modal UI spec:**
```
┌─────────────────────────────────────────┐
│  ✕                  New Patient         │
├─────────────────────────────────────────┤
│                                         │
│  Full Name *          [________________]│
│                                         │
│  Age *    Gender *                      │
│  [____]   [▾ Select___]                 │
│                                         │
│  Status           Room       Bed        │
│  [▾ Stable__]     [____]     [____]     │
│                                         │
│  Admitting Diagnosis                    │
│  [________________________________]     │
│  [________________________________]     │
│                                         │
├─────────────────────────────────────────┤
│  🔗 Open Full Form    [Cancel] [Save]   │
└─────────────────────────────────────────┘
```

**Accessibility:** Focus trap inside modal, `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Escape key to close, auto-focus first field.

---

### Phase 4 — Full Patient Intake Page
**Files:** 3 new, 1 modified

| # | Task | File | Details |
|---|------|------|---------|
| 4.1 | Create full page component | `src/pages/NewPatientPage.jsx` | Multi-section form: Demographics, Vitals, Medications, Alerts, Diagnosis. Uses `AppShell` layout. Submit → `createPatient()` → redirect to `/dashboard` |
| 4.2 | Create page CSS | `src/pages/NewPatientPage.css` | Consistent with dashboard dark theme. Section cards, form grid, responsive |
| 4.3 | Create vitals input component | `src/components/clinical/VitalsInput.jsx` | Reusable vitals entry: HR, BP (sys/dia), Temp, SpO₂ with unit labels and normal range hints |
| 4.4 | Add route to App.jsx | `src/App.jsx` | Lazy-load `NewPatientPage` at `/patients/new` route |

**Full form sections:**

| Section | Fields |
|---------|--------|
| **Demographics** | Name*, Age*, Gender* (select), Room, Bed |
| **Clinical Status** | Status (select: critical/urgent/moderate/stable), Admitting Diagnosis (textarea) |
| **Vitals** | Heart Rate, Blood Pressure (systolic/diastolic), Temperature, SpO₂ — each with value + unit |
| **Medications** | Dynamic list — add/remove entries (free text medication names) |
| **Alerts** | Dynamic list — message + severity (critical/warning/info) |

---

### Phase 5 — Tests & Polish
**Files:** 3 new, 1 modified

| # | Task | File | Details |
|---|------|------|---------|
| 5.1 | Backend e2e test | `backend/test/patient-crud.e2e-spec.ts` | POST /api/patients with valid/invalid data, GET /api/patients/:id, verify 201/400/404 responses |
| 5.2 | Modal unit tests | `tests/frontend/unit/components/NewPatientModal.test.jsx` | Render, validation, submit flow, escape-to-close, "Open Full Form" navigation |
| 5.3 | Full page unit tests | `tests/frontend/unit/pages/NewPatientPage.test.jsx` | Form rendering, section toggles, submit, validation errors |
| 5.4 | Dashboard integration | `tests/frontend/unit/components/Dashboard.test.jsx` | Modal opens on "+ New Patient", closes on cancel/save, dashboard data refreshes post-save |

---

## Data Flow

```
User clicks "+ New Patient"
       │
       ▼
NewPatientModal opens (Dashboard stays visible behind overlay)
       │
       ├─ Fill quick form → [Save]
       │       │
       │       ▼
       │  dashboardService.createPatient(data)
       │       │
       │       ▼
       │  POST /api/patients  →  PatientController.create()
       │       │                      │
       │       │              PatientService.createPatient(dto)
       │       │                      │
       │       │              TypeORM repo.save(patient)
       │       │                      │
       │       ▼                      ▼
       │  201 { id, name, ... }  ←── Saved patient
       │       │
       │       ▼
       │  Close modal → useDashboard.refresh() → updated patient list
       │
       └─ Click "Open Full Form"
               │
               ▼
         navigate('/patients/new')
               │
               ▼
         NewPatientPage (full form with vitals, meds, alerts)
               │
               ▼
         [Save Patient] → same API → redirect /dashboard
```

---

## Design Tokens & Styling Guide

All new components use existing CSS custom properties:

| Token | Usage |
|-------|-------|
| `--surface-primary` | Modal/card backgrounds |
| `--surface-secondary` | Form input backgrounds |
| `--text-primary` | Labels, headings |
| `--text-secondary` | Placeholder text, hints |
| `--border-color-subtle` | Input borders, dividers |
| `--clinical-primary` | Save/submit button |
| `--clinical-warning` | Validation errors |
| `--space-*` | All spacing/padding |
| `--border-radius` | Input/card corners |
| `--font-size-*` | Typography scale |

---

## File Inventory

| Phase | New Files | Modified Files |
|-------|-----------|----------------|
| 1 | `dto/create-patient.dto.ts` | `patient.controller.ts`, `patient.service.ts` |
| 2 | — | `dashboardService.js`, `useDashboard.js` |
| 3 | `NewPatientModal.jsx`, `NewPatientModal.css` | `Dashboard.jsx` |
| 4 | `NewPatientPage.jsx`, `NewPatientPage.css`, `VitalsInput.jsx` | `App.jsx` |
| 5 | `patient-crud.e2e-spec.ts`, `NewPatientModal.test.jsx`, `NewPatientPage.test.jsx` | — |

**Total: 8 new files, 6 modified files**

---

## Implementation Order

```
Phase 1 (Backend)  →  Phase 2 (Service)  →  Phase 3 (Modal)  →  Phase 4 (Full Page)  →  Phase 5 (Tests)
```

Each phase is independently testable. Phase 3 (modal) delivers immediate user value — the "+ New Patient" button becomes functional. Phase 4 (full page) extends with comprehensive intake. Phase 5 locks it down with tests.

---

## Status

| Phase | Status |
|-------|--------|
| Phase 1 — Backend CRUD | ✅ Complete |
| Phase 2 — Frontend Service | ✅ Complete |
| Phase 3 — Dashboard Modal | ✅ Complete |
| Phase 4 — Full Patient Page | ✅ Complete |
| Phase 5 — Tests & Polish | ✅ Complete |
