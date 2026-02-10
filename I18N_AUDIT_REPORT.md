# CareDroid-Ai — i18n Hardcoded String Audit Report

**Date:** Generated from full source review  
**Scope:** All `.jsx` files under `src/` (126 files total)  
**Excluded (already wired):** `Sidebar.jsx`, `Dashboard.jsx`, `DashboardHeader.jsx`  
**i18n system:** `useLanguage()` → `{ t, language, setLanguage }` from `src/contexts/LanguageContext.jsx`

---

## Summary

| Priority | Files needing work | Estimated hardcoded strings |
|----------|-------------------:|----------------------------:|
| 🔴 Critical (High-traffic pages) | 8 | ~550+ |
| 🟠 High (Dashboard components) | 12 | ~200+ |
| 🟡 Medium (Tools / Secondary pages) | 10 | ~150+ |
| 🟢 Low (Legal / Utility / Atoms) | 8 | ~80+ |
| **Total** | **38** | **~980+** |

---

## 🔴 CRITICAL PRIORITY — High-Traffic Pages

### 1. `src/pages/Settings.jsx` (~1550 lines)
- **Imports `useLanguage`:** YES — but only uses `setLanguage` (line 385), **NOT `t()`**. All UI strings remain hardcoded.
- **Estimated strings:** ~120+
- **Key hardcoded strings:**

| Lines | Strings |
|-------|---------|
| 17–22 | Tab labels: `'Appearance'`, `'Accessibility'`, `'Security'`, `'Notifications'`, `'Data & Storage'`, `'About'` + descriptions |
| 24–28 | `'System'`, `'Light'`, `'Dark'`, `'Follow OS preference'`, `'Bright background'`, `'Easy on the eyes'` |
| 30–37 | `'Blue'`, `'Green'`, `'Purple'`, `'Amber'`, `'Rose'`, `'Cyan'` |
| 39–43 | `'Small'`, `'Medium'`, `'Large'` |
| 45–49 | `'Compact'`, `'Comfortable'`, `'Spacious'` |
| 51–55 | `'Standard'`, `'Monospace'`, `'Dyslexia-friendly'` |
| 82–90 | Keyboard shortcuts: `'Command palette'`, `'Toggle sidebar'`, `'New conversation'`, `'Quick settings'`, `'Search settings'` |
| ~835 | `"Settings"` (page heading) |
| ~835 | `"customized"`, `"All defaults"`, `"unsaved"`, `"Up to date"` |
| ~860 | `"Search settings…"` (placeholder) |
| ~870+ | SectionCard titles: `"Theme"`, `"Accent Color"`, `"Display"`, `"Feedback & Effects"`, `"Language"`, `"Clinical"`, `"Visual"`, `"Assistive Technology"`, `"Keyboard Shortcuts"`, `"Accessibility Score"` |
| ~900+ | Toggles: `"Sound effects"`, `"Haptic feedback"`, `"Animate charts"`, `"Show tooltips"`, `"High contrast mode"`, `"Reduced motion"`, `"Screen reader optimizations"`, `"Clinical safety banner"` |
| ~900+ | Toggle descriptions: `"Play sounds for notifications…"`, `"Vibrate on mobile…"`, etc. |
| ~1000+ | Preview: `"Preview: Patient vitals within normal range…"` |
| ~1100+ | Toasts: `"Settings reset to defaults"`, `"Saved locally"`, `"Settings exported"` |
| ~1200+ | Tooltips: `"Search settings (Ctrl+F)"`, `"Import settings"`, `"Export settings"` |

---

### 2. `src/pages/Auth.jsx` (~473 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~35

| Lines | Strings |
|-------|---------|
| 49 | `'Two-factor required'`, `'Please enter your 2FA code.'` |
| 66 | `'Signed in'`, `'Welcome to CareDroid!'` |
| 68 | `'Registration complete'`, `'Please verify your email.'` |
| 72 | `'Authentication failed'`, `'Unable to authenticate…'` |
| 82 | `'Invalid code'`, `'Please enter a valid 6-digit code.'` |
| 158 | `"Two-Factor Authentication"`, `"Enter the 6-digit code from your authenticator app"` |
| 182 | `"Cancel"`, `"Verify"` |
| 215 | `"Use backup code instead?"` |
| 227 | `"Institutional Sign-In"`, `"Secure access for hospitals…"` |
| 237 | `"Send Link"`, placeholder `"name@institution.org"` |
| 244 | `"🔐 Institutional SSO (OIDC)"`, `"🏢 Institutional SSO (SAML)"` |
| 290 | `"Or continue with social login"` |
| 303 | `"🔎 Continue with Google"`, `"💼 Continue with LinkedIn"` |
| 358 | `"⚡ Direct Sign-In (no auth)"` |
| 374 | `"Or sign in with email and password"` |
| ~400 | Placeholders: `"Full name"`, `"Email address"`, `"Password"` |
| ~420 | `"Sign in"` / `"Create account"` |
| ~440 | `"New here?"`, `"Create account"`, `"Already have an account?"`, `"Sign in"`, `"← Back to chat"` |

---

### 3. `src/pages/Chat.jsx` (~357 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~10

| Lines | Strings |
|-------|---------|
| ~170 | `"Welcome to CareDroid"` |
| ~173 | `"Ask me anything about medicine, drugs, lab values, clinical protocols, and more."` |
| ~176 | `"💡 Select a clinical tool from the sidebar to get started"` |
| ~244 | `"Thinking..."` |
| ~275 | `"Suggested tools"` |
| ~335 | Placeholder: `"Ask me anything... (e.g., drug interactions, lab values, diagnosis)"` |
| ~349 | `"Send"` |

---

### 4. `src/pages/team/TeamManagement.jsx` (~1002 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~80+

| Lines | Strings |
|-------|---------|
| 19–23 | `'Physician'`, `'Nurse'`, `'Student'`, `'Admin'` |
| 25–30 | `'Available'`, `'Busy'`, `'DND'`, `'In Surgery'`, `'Off Shift'` |
| 71 | `'Never'`, `'Just now'`, `'m ago'`, `'h ago'`, `'d ago'` |
| ~237 | `"Team Management"`, `"Manage team members, roles, and permissions"` |
| ~243 | `"Invite Member"` |
| ~251–256 | `'Total'`, `'Online'`, `'On-Call'`, `'Physicians'`, `'Nurses'`, `'Students'` |
| ~275 | Placeholder: `"Search name, email, specialty..."` |
| ~287–295 | `"All Roles"`, `"Physician"`, `"Nurse"`, `"Student"`, `"Admin"`, `"All Status"`, `"Active"`, `"Inactive"`, `"On-Call"` |
| ~356 | `"member"` / `"members"` |
| ~400+ | Table headers: `'Name'`, `'Role'`, `'Specialty'`, `'Status'`, `'Last Seen'`, `'Actions'` |
| ~450+ | Empty: `"No team members found"`, `"Clear Filters"` |
| ~500+ | `"Recent Team Activity"` |
| ~600+ | Drawer: `"Member Detail"`, `"📋 Professional Details"`, `"🔐 Role & Permissions"`, `"📊 Activity"`, `"📅 Schedule"` |
| ~650+ | Labels: `"License"`, `"Specialty"`, `"Institution"`, `"Country"`, `"Timezone"`, `"Member Since"`, `"Assigned Role"`, `"Last Login"`, `"Last IP"`, `"Email"`, `"Status"` |
| ~700+ | `"📧 Message"`, `"🔒 Deactivate"`, `"🔓 Reactivate"`, `"View"`, `"✅ Verified"` |
| ~800+ | InviteModal: `"Invite Team Members"`, `"Send invitations to join…"`, `"Email Address(es)"`, `"Assign Role"`, `"Cancel"`, `"Send Invite"` / `"Send Invites"`, `"Sending…"` |
| ~850 | Placeholder: `"colleague@hospital.org, another@hospital.org"` |
| ~900+ | `"Currently On-Call"`, `"Available for emergency consults…"` |
| ~950 | Confirm: `'Deactivate this team member? They will lose access.'` |

---

### 5. `src/pages/Profile.jsx` (~385 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~45

| Lines | Strings |
|-------|---------|
| 22–28 | Permission group titles: `'PHI Data Access'`, `'Clinical Tools'`, `'User Management'`, `'Audit & Compliance'`, `'System Admin'`, `'Emergency & Safety'` |
| ~207 | `"Profile Complete"` |
| ~213 | `"✏️ Edit Profile"` |
| ~226 | `"Complete your profile"`, `"Missing:"`, `"Complete Now"` |
| ~250 | Section titles: `"Professional Details"`, `"Account & Security"`, `"Activity Summary"`, `"Permissions & Access"` |
| ~280 | Labels: `"License"`, `"Specialty"`, `"Institution"`, `"Country"`, `"Timezone"`, `"Language"`, `"Email"`, `"Two-Factor Auth"`, `"Last Login"`, `"Last IP"`, `"Password"` |
| ~310 | `"✅ Verified"` / `"⚠️ Not configured"`, `"✓ Verified"` / `"Unverified"` |
| ~330 | `"Change Password"`, `"📜 View My Audit Log"` |
| ~350 | `"No tool usage recorded yet. Start using clinical tools…"` |
| ~370 | `"Member since"`, `"🔧 Top Tools Used"`, `"Trust Score"` |

---

### 6. `src/pages/ProfileSettings.jsx` (~443 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~60

| Lines | Strings |
|-------|---------|
| 25–30 | Tab labels: `'👤 Personal'`, `'🔒 Security'`, `'🔔 Notifications'`, `'🛡️ Privacy'` |
| ~40 | `"Profile Settings"`, `"Update your clinical profile and preferences."` |
| ~50 | `"← Back to Profile"` |
| ~80+ | Section headings: `"Identity"`, `"Professional"`, `"Locale"`, `"Change Password"`, `"Alert Notifications"`, `"Clinical Updates"`, `"Consent Management"`, `"Data & Account"` |
| ~100+ | Labels: `"First Name"`, `"Last Name"`, `"Display Name"`, `"Specialty"`, `"Institution"`, `"License Number"`, `"Country"`, `"Language"`, `"Timezone"`, `"Current Password"`, `"New Password"`, `"Confirm Password"` |
| ~130+ | Placeholders: `"First name"`, `"Last name"`, `"Display name (shown in sidebar)"`, `"Hospital or clinic name"`, `"Medical license number"`, `"e.g. America/New_York"`, etc. |
| ~200+ | Toggles: `"Critical alerts"`, `"High priority alerts"`, `"Medium priority alerts"`, `"Low priority alerts"`, `"Shift reminders"`, `"Lab result notifications"`, `"Order status updates"`, `"System announcements"`, `"Marketing communications"`, `"Data processing for analytics"`, `"Third-party data sharing"` |
| ~300+ | Buttons: `"Save Profile"` / `"Saving…"`, `"Change Password"` / `"Changing…"`, `"Save Notification Preferences"`, `"Update Consent"` / `"Saving…"` |
| ~350 | `"📥 Download My Data"`, `"🗑️ Request Account Deletion"` |
| ~380 | `"Manage your data consent preferences in compliance with GDPR/CCPA…"` |
| ~400 | Confirm: `'Are you sure you want to request account deletion?…'` |
| ~420 | Toasts: `'Profile saved'`, `'Profile saved locally'`, `'Consent updated'` |

---

### 7. `src/pages/AuditLogs.jsx` (~774 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~50

| Lines | Strings |
|-------|---------|
| 16–22 | Severity labels: `'Critical'`, `'Warning'`, `'Auth'`, `'2FA'`, `'Clinical'`, `'Admin'` |
| 24–46 | Action labels: `'Login'`, `'Logout'`, `'Registration'`, `'Password Change'`, `'2FA Enabled'`, `'2FA Disabled'`, `'Permission Granted'`, `'Permission Denied'`, `'Data Export'`, `'Data Deletion'`, `'PHI Access'`, `'AI Query'`, `'Clinical Data'`, `'Security Event'`, `'Profile Update'`, `'Emergency Access'`, `'Emergency Failed'` |
| ~100 | `"📜 Audit Trail"`, `"HIPAA-compliant event log with SHA-256 hash chain verification"` |
| ~120 | `"Chain: VALID"` / `"Chain: TAMPERED"`, `"⟳ Verify"` / `"⟳ Verifying…"` |
| ~140 | `"📥 CSV"`, `"🏥 PHI Only"` |
| ~160 | Stats: `'Total Logs'`, `'Today'`, `'PHI Access'`, `'Security Events'`, `'Logins'` |
| ~200 | `"Live Feed"`, `"Just now"` |
| ~220 | Placeholder: `"Search resource, user, action…"` |
| ~240 | `"All Actions"`, `"All Severities"` |
| ~260 | `"timeline"`, `"table"` |
| ~300 | `"Loading audit trail…"` |
| ~320 | `"📭 No audit logs found"`, `"Try adjusting your filters…"` |

---

### 8. `src/pages/AnalyticsDashboard.jsx` (~730 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~40

| Lines | Strings |
|-------|---------|
| 26–32 | Stats: `'Total Events'`, `'Active Clinicians'`, `'Tool Invocations'`, `'Avg Response Time'`, `'Error Rate'`, `'Data Exported'` |
| 36–41 | Date presets: `'24h'`, `'7d'`, `'30d'`, `'90d'` |
| 43–48 | Funnel: `'Login'`, `'Tool Access'`, `'Result Viewed'`, `'Data Exported'` |
| ~80 | `"📊 Clinical Analytics"`, `"Real-time usage insights & operational metrics"` |
| ~100 | `"events"` (live badge) |
| ~120 | `"Overview"`, `"Tools"`, `"Engagement"`, `"Funnel"` |
| ~150 | `"📈 Event Trend"`, `"🧰 Top Tools"` |
| ~200 | `"📥 CSV"`, `"🔄 Refresh"`, `"🔄 Retry"` |
| ~250 | `"vs prior"` |

---

### 9. `src/App.jsx` (~218 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~5

| Lines | Strings |
|-------|---------|
| 93 | `"Loading…"` |
| 103 | `"🏥 CareDroid"` |
| 105 | `"Clinical AI Platform for Healthcare Professionals"` |
| 115 | `"Sign In"` |

---

## 🟠 HIGH PRIORITY — Dashboard Components

### 10. `src/components/dashboard/EmergencyModal.jsx` (~575 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~60+

| Lines | Strings |
|-------|---------|
| 6–8 | Severity options: `'Critical — Immediate life threat'`, `'Urgent — Requires rapid response'`, `'Moderate — Needs prompt attention'` |
| 12–20 | Emergency types: `'Cardiac Arrest / STEMI'`, `'Respiratory Failure'`, `'Stroke / Neurological'`, `'Trauma / Hemorrhage'`, `'Sepsis / Septic Shock'`, `'Anaphylaxis'`, `'Seizure / Status Epilepticus'`, `'Overdose / Toxicology'`, `'Other — specify in notes'` |
| 271 | `"🚨 Emergency Documented"`, `"🚨 Emergency Protocol"` |
| 280 | `"Emergency Record Saved"` |
| 300 | `"Actions Taken"`, `"Done"` |
| 330 | Section titles: `"Patient Identification"`, `"Emergency Classification"`, `"Vital Signs"`, `"Immediate Actions"`, `"Clinical Notes & Documentation"` |
| 335 | `"Quick-Select Patient"`, `"— Select existing patient —"` |
| 350 | Labels: `"Patient Name"`, `"Room / Location"` |
| 390 | `"Severity Level"`, `"Emergency Type"`, `"Select emergency type…"`, `"Chief Complaint"` |
| 435 | Placeholder: `"Describe the presenting emergency…"` |
| 465 | Action buttons: `"Call 911"`, `"Dispatch emergency services"`, `"Escalate to MD"`, `"Notify attending physician"`, `"Activate Code"` / `"Code Activated"`, `"Team has been paged"` / `"Page code team & RRT"`, `"Page RRT"`, `"Rapid Response Team"` |
| 495 | `"Action Log"` |
| 530 | `"Clinical Notes"`, placeholder: `"Document interventions, patient response…"` |
| 555 | Disclaimer: `"⚠️ Medical Disclaimer: This system provides decision support only…"` |
| 565 | `"Cancel"`, `"Documenting…"` / `"Document & Close"` |

---

### 11. `src/components/dashboard/SmartTriageQueue.jsx` (~284 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~25

| Lines | Strings |
|-------|---------|
| ~20 | `"Triage Queue"`, `"resolved"`, `"Active"` |
| ~80+ | SBAR headings/text, triage-related labels |
| ~150 | `"No resolved alerts"` |
| ~200 | `"Immediate clinical assessment required"`, `"Escalate to attending…"` |

---

### 12. `src/components/dashboard/CommandFeed.jsx` (~194 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~15

| Lines | Strings |
|-------|---------|
| 6–12 | Tabs: `'All'`, `'Labs'`, `'Meds'`, `'Vitals'`, `'Notes'`, `'Imaging'` |
| ~80 | `"Command Feed"`, `"LIVE"` |
| ~91 | `"items"` |
| ~120 | Actions: `'View Result'`, `'Mark Admin\'d'`, `'View Trend'`, `'Open Image'`, `'Read Note'` |
| ~150 | `"No activity in this category"` |
| ~170 | `"Just now"`, `"m ago"`, `"h ago"`, `"d ago"`, `"Patient:"` |

---

### 13. `src/components/dashboard/AlertsPanel.jsx` (~228 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~12

| Lines | Strings |
|-------|---------|
| ~30 | `"Active Alerts"` |
| ~80 | `"No active alerts"`, `"All systems normal"` |
| ~120 | Time: `"Just now"`, `"min ago"`, `"hour"` / `"hours ago"` |
| ~150 | Severity badges: `"CRITICAL"`, `"HIGH"` |

---

### 14. `src/components/dashboard/NewPatientModal.jsx` (~527 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~40

| Lines | Strings |
|-------|---------|
| ~20 | Gender options: `"Male"`, `"Female"`, `"Non-Binary"`, `"Prefer not to say"` |
| ~40 | Status labels |
| ~100 | Validation: `"Name is required"`, `"Age is required"`, `"Gender is required"` |
| ~200+ | Section headers, field labels, placeholder text |

---

### 15. `src/components/dashboard/QuickOrders.jsx` (~120 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~8

| Lines | Strings |
|-------|---------|
| ~20 | `"Quick Orders"`, `"⚡ Fast Path"` |
| ~40 | `"Select patient…"`, `"No room"` |
| ~80 | `"Recent Orders — click to reorder"` |

---

### 16. `src/components/dashboard/OnCallRoster.jsx` (~104 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~10

| Lines | Strings |
|-------|---------|
| ~20 | `"📞 On-Call Roster"`, `"Today"` |
| ~50 | Status: `"Available"`, `"In Surgery"`, `"Off-site"`, `"Busy"` |
| ~80 | `"📟 Page"`, `"💬 Msg"` |

---

### 17. `src/components/dashboard/MyWorkload.jsx` (~128 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~8

| Lines | Strings |
|-------|---------|
| ~20 | `"My Workload"` |
| ~40 | `"Shift ends in"`, `"tasks done"` |
| ~80 | `"Handoff Notes"` (placeholder) |

---

### 18. `src/components/dashboard/BedBoard.jsx` (~148 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~6

| Lines | Strings |
|-------|---------|
| ~20 | `"🛏️ Bed Board"` |
| ~40 | `"All"` (filter) |
| ~60 | `"beds occupied"` |

---

### 19. `src/components/dashboard/NotificationDropdown.jsx` (~214 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~10

| Lines | Strings |
|-------|---------|
| 5, 13 | `"Just now"` |
| 14 | `"min ago"` |
| 15 | `"hour"` / `"hours ago"` |
| 16 | `"day"` / `"days ago"` |
| ~60 | `"Notifications"`, `"new"` |
| ~100 | `"No notifications"` |

---

### 20. `src/components/dashboard/ActivityFeed.jsx` (~182 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~5

| Lines | Strings |
|-------|---------|
| 63 | `"Recent Activity"` |
| 82 | `"Live"` |
| 92 | `"Last 24 hours"` |

---

### 21. `src/components/dashboard/MARPreview.jsx` (~125 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~5

| Lines | Strings |
|-------|---------|
| 57 | `"💊 MAR Preview"` |
| 58 | `"overdue"` |
| 61 | `"Next 2 hours"` |
| 67 | `"Open Full MAR →"` |

---

### 22. `src/components/dashboard/LabTimeline.jsx` (~158 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~8

| Lines | Strings |
|-------|---------|
| 48 | `"🧪 Lab Timeline"` |
| 49 | `"critical"` |
| 53 | `"new"` |
| 73 | `"All Labs"` |
| 78 | `"pending"` |
| 81 | `"Last 12h"` |

---

## 🟡 MEDIUM PRIORITY — Tool Pages & Secondary Pages

### 23. `src/pages/tools/ToolsOverview.jsx`
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~20

| Lines | Strings |
|-------|---------|
| ~20 | `"🔧 Clinical Tools Suite"` |
| ~40 | `"🕓 Recent Tools"`, `"💡 Quick Tips"` |
| ~60 | Stats: `"Tools Available"`, `"Categories"`, `"Availability"` |
| ~100 | `"Keyboard Shortcuts"`, `"Chat Integration"`, `"State Persistence"`, `"AI Awareness"` |

---

### 24. `src/pages/tools/DrugChecker.jsx`
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~15

| Lines | Strings |
|-------|---------|
| ~30 | `"Enter Medications"`, placeholder: `"Enter medication name (e.g., Warfarin)"` |
| ~80 | `"Drug Interactions Found"`, `"Clinical Warnings"` |
| ~120 | `"No Major Interactions Detected"` |
| ~150 | `"💡 Quick Reference"` |

---

### 25. `src/pages/tools/DiagnosisAssistant.jsx`
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~12

| Lines | Strings |
|-------|---------|
| 66 | h2 heading (diagnosis prompt) |
| 87 | Placeholder: `"e.g., Chest pain with diaphoresis…"` |
| 108 | Placeholder: `"Years"` |
| 153 | Placeholder: `"e.g., HTN, DM, prior MI…"` |
| 202 | h2 heading (results section) |

---

### 26. `src/pages/tools/LabInterpreter.jsx`
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~10

| Lines | Strings |
|-------|---------|
| 155 | Placeholder: `"Years"` |
| 179 | Placeholder: `"e.g., Sepsis evaluation, routine check-up…"` |
| 194 | Placeholder: `"e.g., Sodium, WBC"` |
| 217 | Placeholder: `"0.0"` |
| 227 | Placeholder: `"mg/dL"` |

---

### 27. `src/pages/tools/Protocols.jsx`
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~5

| Lines | Strings |
|-------|---------|
| 32 | Placeholder: `"Search for a protocol (e.g., Sepsis, STEMI, DKA)…"` |

---

### 28. `src/pages/tools/Calculators.jsx`
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~15+ (many placeholders for clinical calculator inputs)

| Lines | Strings |
|-------|---------|
| 222–378 | Numerous placeholders: `"80-100"`, `"0.21"`, `"150"`, `"1.0"`, `"70"`, `"Dopamine"`, `"Norepinephrine"`, `"Epinephrine"`, `"15"`, `"1500"` |
| 922 | `"65+ = 1 pt, 75+ = 2 pts"` |

---

### 29. `src/pages/ClinicalDashboard.jsx` (~328 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~10

| Lines | Strings |
|-------|---------|
| 132 | `"Clinical Dashboard"` |
| 140 | `"Enhanced clinical interface with improved design system"` |
| 144 | `"Add New Patient"` |

---

### 30. `src/pages/CostAnalyticsDashboard.jsx`
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~12

| Lines | Strings |
|-------|---------|
| 119 | `"💰 Cost Analytics"` |
| 127 | `"Export as CSV"` |
| 135 | `"Export as PDF"` |
| 165 | `"Total Cost"` |
| 170 | `"Monthly Cost"` |
| 186 | `"Avg Cost/Tool"` |
| 195 | `"Total Executions"` |
| 203 | `"Return on Investment (ROI)"` |
| 235 | `"Top Spending Tools"` |
| 268 | `"Cost by Category"` |
| 301 | `"30-Day Cost Trend"` |

---

### 31. `src/pages/Onboarding.jsx` (~121 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~20

| Lines | Strings |
|-------|---------|
| ~20 | Step titles: `"Choose your role"`, `"Set your focus"`, `"Safety & compliance"` |
| ~40 | Descriptions for each step |
| ~60 | Role options: `"Physician"`, `"Nurse"`, etc. |
| ~90 | `"Step X of Y"` |
| ~100 | Buttons: `"Back"`, `"Next"`, `"Get Started"` |

---

### 32. `src/pages/HelpCenter.jsx` (~237 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~50+ (all FAQ content)

| Lines | Strings |
|-------|---------|
| ~20 | Section titles: `"Getting Started"`, `"Using Clinical Tools"`, `"Account & Security"`, `"Privacy & Compliance"`, `"Troubleshooting"` |
| ~40–200 | All Q&A pairs (text-heavy — many strings) |
| ~210 | Contact section text |

---

## 🟢 LOW PRIORITY — Legal, Security Setup, Utility Components

### 33. `src/pages/TwoFactorSetup.jsx` (~407 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~35

| Lines | Strings |
|-------|---------|
| 61 | `'Invalid code'`, `'Please enter a valid 6-digit code.'` |
| 84 | `'2FA enabled'`, `'Save your backup codes.'` |
| 85 | `'Invalid code'`, `'Please try again.'` |
| 98 | `'Backup codes copied'`, `'Backup codes copied to clipboard.'` |
| 100 | `'Copy failed'`, `'Failed to copy backup codes.'` |
| 112 | `'Backup codes downloaded'` |
| 144 | `"Set Up Two-Factor Authentication"` |
| 150 | `"Add an extra layer of security to your CareDroid account"` |
| 163 | `"Step 1: Scan QR Code"` |
| 175 | Instructions: `"Install Google Authenticator…"`, `"Open the app…"`, `"Enter the 6-digit code…"` |
| 187 | `"Generating QR code…"` |
| 207 | `"Can't scan? Enter this key manually:"` |
| 228 | `"Failed to generate QR code. Please refresh the page."` |
| 233 | `"Continue to Verification"` |
| 250 | `"Step 2: Verify Setup"` |
| 258 | `"Enter the 6-digit code from your authenticator app to verify the setup."` |
| 285 | `"Back"` |
| 293 | `"Verifying…"` / `"Verify & Enable"` |
| 310 | `"Step 3: Save Backup Codes"` |
| 326 | `"⚠️ Important: Save these backup codes…"` |
| 367 | `"📋 Copy Codes"` |
| 375 | `"💾 Download Codes"` |
| 381 | `"Finish Setup"` |
| 399 | `"Skip for now"` |

---

### 34. `src/pages/BiometricSetup.jsx`
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~15

| Lines | Strings |
|-------|---------|
| 241 | `"🔒 Biometric Disabled"` |
| 244 | Button to settings |
| 257 | `"⚠️ Biometric Not Available"` |
| 275 | `"Biometric Authentication"` |
| 285 | `"Biometric Enabled"` |
| 291 | `"Not Enrolled"` |
| 299 | `"Usage Statistics"` |
| 303 | `"Enrolled Devices"` |
| 307 | `"Total Logins"` |
| 313 | `"Last Used"` |
| 320 | `"How It Works"` |

---

### 35. `src/pages/NewPatientPage.jsx` (~453 lines)
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~40 (mirrors NewPatientModal.jsx)

---

### 36. `src/components/ErrorBoundary.jsx` (~130 lines)
- **Imports `useLanguage`:** NO (**class component — cannot use hooks directly**)
- **Estimated strings:** ~5

| Lines | Strings |
|-------|---------|
| ~60 | `"⚠️ Something went wrong"` |
| ~65 | `"The application encountered an unexpected error…"` |
| ~80 | `"Error Details"` |
| ~100 | `"🔄 Reload Application"` |

> **Note:** Class component — will need HOC or render-prop wrapper for `t()`.

---

### 37. `src/components/TwoFactorSettings.jsx`
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~10

| Lines | Strings |
|-------|---------|
| 90, 106 | `"Two-Factor Authentication"` |
| 244 | `"Disable Two-Factor Authentication"` |
| Buttons | Enable/Disable/Cancel/Verify text |

---

### 38. `src/components/WorkspaceCreationModal.jsx`
- **Imports `useLanguage`:** NO
- **Estimated strings:** ~10

| Lines | Strings |
|-------|---------|
| 137 | `"Create New Workspace"` |
| 144 | `"Quick Templates"` |
| 162 | Label (workspace name) |
| 173 | Placeholder: `"e.g., Emergency Medicine"` |
| 181 | `"Icon"` |
| 197 | `"Color"` |

---

### 39. Legal Pages (lower priority — rarely viewed, legal text may need separate handling)

| File | Key Strings |
|------|-------------|
| `src/pages/legal/TermsOfService.jsx` | `"Terms of Service"` + section headings |
| `src/pages/legal/ConsentHistory.jsx` | `"Consent History"`, `"Consent Event"`, `"About Consent Records"` |
| `src/pages/GDPRNotice.jsx` | `"GDPR Privacy Notice"` + h2 section headings (lines 58–96), `"Contact Our Data Protection Officer"` (line 109) |
| `src/pages/HIPAANotice.jsx` | `"HIPAA Notice of Privacy Practices"` + h2 section headings (lines 58–93), `"HIPAA Privacy Officer"` (line 113) |

---

### 40. Additional Components with minor hardcoded strings

| File | `useLanguage` | Key Strings |
|------|:---:|-------------|
| `src/components/LiveCostDashboard.jsx` | NO | `"💹 Live Cost Dashboard"` (L215), `"Time Range:"` (L236), `"Top Cost Tools"` (L271), `"🔔 Recent Alerts"` (L303), `"📊 Recent Updates"` (L342), `"📈 Trending Tools"` (L370) |
| `src/components/dashboard/ClinicalBanner.jsx` | NO | Dynamic banner text (data-driven, minor) |
| `src/components/ChatInterface.jsx` | NO | AI response text, error messages |
| `src/components/ToolPanel.jsx` | NO | Minimal — h3 heading is dynamic from prop |

---

## Recommended Implementation Order

1. **Settings.jsx** — Highest string count (~120+), already imports `useLanguage`, just needs `t()` calls
2. **Auth.jsx** — First user touchpoint (login page)
3. **Chat.jsx** — Most-used page daily
4. **TeamManagement.jsx** — Complex page with ~80+ strings
5. **ProfileSettings.jsx** — User-facing settings
6. **Profile.jsx** — User profile view
7. **AuditLogs.jsx** — Compliance-critical
8. **AnalyticsDashboard.jsx** — Analytics view
9. **EmergencyModal.jsx** — Clinical safety (high visibility during emergencies)
10. **Dashboard components** (CommandFeed, AlertsPanel, etc.) — Batch together
11. **Tool pages** — Batch together
12. **TwoFactorSetup / BiometricSetup** — Security setup flows
13. **Legal pages** — Lowest priority, may require legal review per language

---

## Notes

- **`ErrorBoundary.jsx`** is a class component and **cannot use hooks**. Wrap with a HOC or convert to functional component.
- **Settings.jsx** already imports `useLanguage` — it just needs the `t` function destructured and applied to all strings (lowest barrier to start).
- **Time-relative strings** (`"Just now"`, `"m ago"`, `"hours ago"`) appear in 5+ components — consider a shared `useRelativeTime(timestamp)` hook returning translated strings.
- **Emoji prefixes** (`"📊"`, `"🔐"`, etc.) should remain outside `t()` calls — only translate the text portion.
- **Placeholder text** in medical/clinical inputs (drug names, units like `"mg/dL"`) may or may not need translation depending on locale conventions.
