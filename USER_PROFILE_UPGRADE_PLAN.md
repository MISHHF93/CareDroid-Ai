# User Profile Upgrade Plan

> **Date:** February 8, 2026  
> **Status:** ✅ Complete — All 5 phases deployed, 363/363 tests passing  
> **Scope:** Upgrade the clinician user profile — Sidebar profile widget, Profile page (`/profile`), and Profile Settings page (`/profile/settings`)

---

## 1. Current State Audit

### 1A. Sidebar Profile Widget (Sidebar.jsx)
| Element | Current State | Problem |
|---|---|---|
| **Avatar** | Single letter initial on green circle | No photo upload, no customization, generic look |
| **Name** | Plain text `user.name` | No truncation tooltip, no verification badge |
| **Role** | Uppercase plain text `user.role` | No specialty shown, no department, no visual role badge |
| **Health dot** | Green/red pulse dot | Only shows system health — no user status (available, busy, in surgery) |
| **Clickability** | Not clickable | Should open quick profile flyout or navigate to `/profile` |
| **Collapsed state** | Hidden entirely | Should show avatar icon only when sidebar collapsed |

### 1B. Profile Page (`/profile` — Profile.jsx)
| Element | Current State | Problem |
|---|---|---|
| **Content** | Placeholder text: "Your profile details will appear here once authentication is connected" | **Completely empty — no real data shown** |
| **Fields** | Name, Email, Role, Institution — all show "—" dashes | Not wired to UserContext or backend |
| **Layout** | Single Card, minimal | No sections, no avatar, no activity, no credentials |
| **Navigation** | "← Back to chat" link | No link to settings, no tabs |

### 1C. Profile Settings Page (`/profile/settings` — ProfileSettings.jsx)
| Element | Current State | Problem |
|---|---|---|
| **Fields** | Display Name, Institution, Role inputs | Not pre-populated from UserContext; values lost on page reload |
| **Save** | Calls `success()` toast — no actual backend call | Not wired to `PATCH /api/users/profile` |
| **2FA Section** | TwoFactorSettings component included | Works — keep as-is |
| **Missing** | No avatar upload, no specialty, no license, no notification preferences, no privacy/consent, no session management | Incomplete settings |

### 1D. Backend (users module)
| Element | Current State | Notes |
|---|---|---|
| **User entity** | id, email, role, lastLoginAt, lastLoginIp, phone (encrypted) | Solid foundation |
| **UserProfile entity** | fullName, firstName, lastName, institution, specialty, licenseNumber, country, languagePreference, timezone, verified, trustScore, avatarUrl, consent fields | Rich schema — **frontend doesn't use 80% of these fields** |
| **GET /api/users/profile** | Returns user + profile + subscription relations | Works but requires JWT auth |
| **PATCH /api/users/profile** | Updates profile fields with audit logging | Works but frontend doesn't call it |

### Verdict
The backend has a **rich UserProfile entity** with 15+ fields, but the frontend shows almost nothing. The Profile page is a stub. The Sidebar profile widget is minimal. This is the biggest gap.

---

## 2. Proposed Upgrades

### Phase 1: Wire Up Profile Page (P0 — Critical)
**Why:** The `/profile` page is a non-functional placeholder. This is the highest priority.

**Replace the stub with a full clinician profile page showing:**

#### Section A: Profile Header / Hero
- Large avatar (from `avatarUrl` or generated initial) with photo upload button
- Full name (bold, large) + verification badge if `verified === true`
- Role badge (colored: Physician=blue, Nurse=green, Student=purple, Admin=gold)
- Specialty + Institution underneath
- Trust score indicator (0–100 bar or ring)
- "Edit Profile" button → navigates to `/profile/settings`

#### Section B: Professional Details Card
- **License Number** (masked: `●●●●-1234`, with reveal toggle)
- **Specialty** (e.g., Critical Care Medicine)
- **Institution** (e.g., Johns Hopkins Hospital)
- **Country** + **Timezone**
- **Language Preference**
- **Member since** (from `createdAt`)

#### Section C: Account & Security Card
- **Email** (with verified/unverified badge)
- **2FA Status** (Enabled ✅ / Not configured ⚠️) with quick-enable link
- **Last Login** — date, time, IP address
- **Active Sessions** — count + "Manage Sessions" link
- **Password** — last changed date + "Change Password" button

#### Section D: Activity Summary Card
- **Total logins** this month
- **Tools used** (top 3 most accessed from `recentTools`)
- **Patients accessed** this week (count, audit-backed)
- **Audit trail link** ("View my Audit Log" → `/audit-logs?user=me`)

#### Section E: Permissions & Access Card
- Visual grid showing which permissions the user's role grants
- Read-only (non-admins can view but not change their own permissions)
- Groups: PHI Access, Clinical Tools, User Management, Audit & Compliance, System Admin, Emergency & Safety

---

### Phase 2: Upgrade Sidebar Profile Widget (P0 — Critical)
**Why:** The sidebar profile is the most visible user-facing element — seen on every page.

#### 2A. Enhanced Avatar
- Show actual profile photo if `avatarUrl` exists
- Fallback to colored initial with role-specific gradient:
  - Physician: blue gradient
  - Nurse: green gradient (current)
  - Student: purple gradient
  - Admin: gold gradient
- Overlay status dot (bottom-right corner):
  - 🟢 Available
  - 🟡 Busy
  - 🔴 Do Not Disturb
  - ⚫ Offline

#### 2B. Richer Info
- Name (first line)
- Role + Specialty (second line, e.g., "Physician · Critical Care")
- Shift time remaining if available (third line, subtle, e.g., "Shift ends in 3h 22m")

#### 2C. Clickable Profile Flyout
- Click the sidebar user area → opens a compact flyout/popover with:
  - Larger avatar + name + role
  - Quick status switcher (Available / Busy / DND)
  - "View Profile" → `/profile`
  - "Settings" → `/profile/settings`
  - "Sign Out" button
  - Connection status (Live / Offline)
- This eliminates the need for separate Sign Out button in the footer

#### 2D. Collapsed State
- When sidebar is collapsed, show only the avatar circle (clickable)
- Tooltip on hover: "Name — Role"
- Status dot still visible

---

### Phase 3: Upgrade Profile Settings Page (P1 — High)
**Why:** Settings page has inputs but doesn't save to backend or show existing data.

#### 3A. Pre-populate from UserContext
- On mount, fill all fields from `user` and `user.profile` from context
- Show loading skeleton while fetching

#### 3B. Full Settings Form
Split into tabbed sections:

**Tab 1: Personal Info**
- Avatar upload (drag-and-drop or click) with crop/preview
- First Name + Last Name
- Display Name (auto-generated from first+last, editable)
- Specialty (dropdown of medical specialties)
- Institution (text input with autocomplete)
- License Number (text, masked display)
- Country (dropdown)
- Language Preference (dropdown)
- Timezone (auto-detected, dropdown override)

**Tab 2: Security**
- Change Password (current → new → confirm)
- Two-Factor Authentication (existing TwoFactorSettings component)
- Active Sessions list with "Revoke" buttons
- Login history (last 10 logins with IP + device + timestamp)

**Tab 3: Notifications**
- Notification preferences:
  - Alert notifications (Critical / High / Medium / Low toggles)
  - Shift reminders (on/off + timing)
  - Lab results notifications (on/off)
  - Order status updates (on/off)
  - System announcements (on/off)
- Delivery method per category: In-app / Push / Email / SMS

**Tab 4: Privacy & Consent**
- Marketing communications consent toggle
- Data processing consent toggle
- Third-party sharing consent toggle
- Data export: "Download My Data" button (GDPR/CCPA)
- Account deletion: "Request Account Deletion" with confirmation flow
- Consent update timestamps shown for each toggle

#### 3C. Save with Backend Integration
- Wire "Save" button to `PATCH /api/users/profile`
- Show inline validation errors
- Optimistic UI update with rollback on failure
- Success toast with "Changes saved" message
- Audit-logged via backend

---

### Phase 4: User Status System (P2 — Medium)
**Why:** Clinicians need to communicate availability to their team.

#### 4A. Status Model
Add to UserProfile or new entity:
```
status: 'available' | 'busy' | 'dnd' | 'in-surgery' | 'off-shift'
statusMessage: string (optional custom message)
statusExpiresAt: Date (auto-clear after X hours)
```

#### 4B. Status Selector
- Quick switcher in sidebar profile flyout
- Preset statuses: Available, Busy, In Surgery, Do Not Disturb, Off Shift
- Custom message field (e.g., "In OR until 14:00")
- Auto-expire option (1h, 2h, 4h, end of shift)

#### 4C. Status Visibility
- Show status dot on sidebar avatar
- Show status on On-Call Roster widget (dashboard)
- Show status in Team page roster
- Push status changes via SSE to connected clients

---

### Phase 5: Profile Completeness & Onboarding (P3 — Nice-to-have)
**Why:** Encourage clinicians to fill out their profile for trust/verification.

#### 5A. Completeness Indicator
- Calculate percentage of filled profile fields
- Show progress ring on profile page header
- Nudge banner: "Complete your profile to unlock all features" (dismissible)
- Fields that count: avatar, name, specialty, institution, license, 2FA, timezone

#### 5B. Verification Flow
- "Request Verification" button on profile page
- Admin review queue (visible on admin dashboard)
- Verified badge appears on profile + sidebar after approval
- Verified users get higher trust score

#### 5C. Quick Setup Wizard
- For new users: multi-step onboarding modal
  1. Upload photo + enter name
  2. Select role + specialty
  3. Enter institution + license
  4. Set timezone + language
  5. Enable 2FA
- Can be skipped but profile shows "Setup incomplete" badge

---

## 3. Proposed Profile Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PROFILE HEADER                                      │   │
│  │  ┌─────────┐                                         │   │
│  │  │  AVATAR  │  Dr. Sarah Mitchell  ✅ Verified       │   │
│  │  │  (photo) │  Physician · Critical Care Medicine    │   │
│  │  │   📷     │  Johns Hopkins Hospital                │   │
│  │  └─────────┘  Trust Score: ████████░░ 82/100         │   │
│  │                                    [Edit Profile]    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ PROFESSIONAL DETAILS ──┬─ ACCOUNT & SECURITY ────────┐  │
│  │ License: ●●●●-4521 👁   │ Email: s.mitchell@jhu.edu ✅│  │
│  │ Specialty: Critical Care│ 2FA: Enabled ✅             │  │
│  │ Institution: JHH        │ Last Login: Feb 7, 14:32    │  │
│  │ Country: United States  │   IP: 10.0.1.42             │  │
│  │ Timezone: EST (UTC-5)   │ Sessions: 2 active          │  │
│  │ Language: English       │ Password: Changed 12d ago   │  │
│  │ Member since: Jan 2025  │        [Change Password]    │  │
│  └─────────────────────────┴─────────────────────────────┘  │
│                                                             │
│  ┌─ ACTIVITY SUMMARY ──────┬─ PERMISSIONS & ACCESS ──────┐  │
│  │ 📊 34 logins this month │ ✅ Read PHI                 │  │
│  │ 🔧 Top tools:           │ ✅ Write PHI                │  │
│  │    Drug Checker (42)     │ ✅ Export PHI               │  │
│  │    Lab Interpreter (38)  │ ✅ Clinical Tools (all)     │  │
│  │    Protocols (21)        │ ✅ Emergency Protocol       │  │
│  │ 👥 12 patients accessed  │ ✅ Override Safety Checks   │  │
│  │    this week             │ ✅ View Audit Logs          │  │
│  │ [View My Audit Log →]   │ ❌ Manage Users             │  │
│  └─────────────────────────┴─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Proposed Sidebar Profile Flyout Layout

```
┌─────────────────────────┐
│  Sidebar                │
│  ┌───────────────────┐  │
│  │ [A] Dr. Mitchell  │──┼───────────────────────────┐
│  │     Physician·CC   │  │  ┌─ PROFILE FLYOUT ─────┐ │
│  └───────────────────┘  │  │  ┌─────────┐          │ │
│                         │  │  │ AVATAR   │ Dr.Sarah │ │
│  [Navigation...]        │  │  │  (lg)    │ Mitchell │ │
│                         │  │  │  🟢      │ Physician│ │
│                         │  │  └─────────┘          │ │
│                         │  │                        │ │
│                         │  │  Status:               │ │
│                         │  │  ● Available            │ │
│                         │  │  ○ Busy                 │ │
│                         │  │  ○ In Surgery           │ │
│                         │  │  ○ Do Not Disturb       │ │
│                         │  │                        │ │
│                         │  │  ─────────────────     │ │
│                         │  │  👤 View Profile       │ │
│                         │  │  ⚙️ Settings            │ │
│                         │  │  🚪 Sign Out           │ │
│                         │  │                        │ │
│                         │  │  🟢 Connected · Live   │ │
│                         │  └────────────────────────┘ │
│                         │                             │
└─────────────────────────┘                             │
                           └────────────────────────────┘
```

---

## 5. Implementation Priority

| Priority | Phase | Upgrade | Effort | Impact |
|---|---|---|---|---|
| **P0** | 1 | Wire up Profile page with real data from UserContext + backend | Medium | Critical — currently a dead page |
| **P0** | 1 | Profile Header with avatar, name, role badge, verification | Medium | High — first visual impression |
| **P0** | 1 | Professional Details + Account & Security cards | Medium | High — core profile info |
| **P0** | 2 | Sidebar profile widget: role-colored avatar, clickable | Small | High — visible on every page |
| **P0** | 2 | Sidebar profile flyout with quick actions | Medium | High — replaces footer sign-out |
| **P1** | 3 | Settings pre-population from context/API | Small | High — currently loses data |
| **P1** | 3 | Full tabbed settings (Personal, Security, Notifications, Privacy) | Large | High — complete settings |
| **P1** | 3 | Backend integration for save (PATCH /api/users/profile) | Small | High — settings actually persist |
| **P1** | 1 | Activity Summary + Permissions cards on profile | Medium | Medium — useful context |
| **P2** | 4 | User status system (available/busy/dnd) | Medium | Medium — team coordination |
| **P2** | 4 | Status dot on sidebar + on-call roster integration | Small | Medium — visibility |
| **P3** | 5 | Profile completeness indicator + nudge banner | Small | Low — onboarding polish |
| **P3** | 5 | Verification request flow | Medium | Low — admin workflow |
| **P3** | 5 | New user onboarding wizard | Medium | Low — first-run experience |

---

## 6. Data Flow

```
Backend UserProfile Entity          Frontend UserContext          UI Components
─────────────────────────          ─────────────────────          ──────────────
fullName                    ──►    user.name                ──►  Sidebar, Profile
firstName / lastName        ──►    user.profile.firstName   ──►  Profile, Settings
institution                 ──►    user.profile.institution ──►  Profile, Settings
specialty                   ──►    user.profile.specialty   ──►  Sidebar, Profile
licenseNumber               ──►    user.profile.license     ──►  Profile (masked)
avatarUrl                   ──►    user.profile.avatarUrl   ──►  Sidebar, Profile
verified                    ──►    user.profile.verified    ──►  Badge on Profile
trustScore                  ──►    user.profile.trustScore  ──►  Ring on Profile
timezone                    ──►    user.profile.timezone    ──►  Profile, Settings
languagePreference          ──►    user.profile.language    ──►  Settings
country                     ──►    user.profile.country     ──►  Profile, Settings
consent* fields             ──►    user.profile.consent*    ──►  Settings Privacy tab
role (User entity)          ──►    user.role                ──►  Sidebar badge, Profile
email (User entity)         ──►    user.email               ──►  Profile, Settings
lastLoginAt (User entity)   ──►    user.lastLoginAt         ──►  Profile Security card
```

---

## 7. Summary

**Current state:** Profile page is a stub showing dashes. Sidebar shows a basic initial + name. Settings don't save. Backend has a rich `UserProfile` entity (15+ fields) that the frontend completely ignores.

**After upgrade:**
- ✅ Profile page becomes a comprehensive clinician identity hub (avatar, credentials, activity, permissions)
- ✅ Sidebar profile widget becomes an interactive, role-colored, status-aware element with flyout
- ✅ Settings page gets tabbed sections (Personal, Security, Notifications, Privacy) that persist to backend
- ✅ User status system enables team situational awareness
- ✅ Profile completeness + verification flow encourages complete profiles
- ✅ All changes audit-logged for HIPAA compliance

**Net result:** The user profile transforms from a dead placeholder into a **professional clinician identity center** — the foundation for trust, team coordination, and regulatory compliance.
