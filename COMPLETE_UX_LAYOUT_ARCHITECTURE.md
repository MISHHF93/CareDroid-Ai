# COMPLETE UX & LAYOUT ARCHITECTURE
## CareDroid Clinical AI - Full Application Design System

> **Version**: 2.0  
> **Last Updated**: January 31, 2026  
> **Status**: Production-Ready Design Blueprint  
> **Target**: Mobile-First, Web, iOS & Android

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Complete Component Inventory](#complete-component-inventory)
3. [Navigation & Information Architecture](#navigation--information-architecture)
4. [Layout Shells & Page Templates](#layout-shells--page-templates)
5. [User Flows & Journey Maps](#user-flows--journey-maps)
6. [Design System & Visual Language](#design-system--visual-language)
7. [Missing Components & Gaps](#missing-components--gaps)
8. [Mobile-Specific Considerations](#mobile-specific-considerations)
9. [Accessibility & Internationalization](#accessibility--internationalization)
10. [Implementation Priority Matrix](#implementation-priority-matrix)

---

## 🎯 EXECUTIVE SUMMARY

CareDroid is a **HIPAA-compliant clinical AI assistant** with a sophisticated, dark-themed UI optimized for medical professionals. This document defines the complete UX architecture including:

- **Current State**: 85% complete base structure
- **28 Core Components** (19 existing + 9 missing)
- **12 Pages/Views** (8 existing + 4 critical missing)
- **4 Layout Shells** (2 existing + 2 needed)
- **Mobile-First Design** with responsive breakpoints
- **Dark Clinical Theme** with accessibility features

### Key Metrics
- **Component Coverage**: 68% (19/28)
- **Page Coverage**: 67% (8/12)
- **Missing Critical Features**: 15 items
- **Estimated Completion**: 3-4 weeks

---

## 🧩 COMPLETE COMPONENT INVENTORY

### ✅ EXISTING COMPONENTS (19)

#### 1. Core UI Components (`src/components/ui/`)
```
✅ Button.jsx              - Primary action buttons with states
✅ Card.jsx                - Container cards with subtle borders
✅ Input.jsx               - Text input with validation states
```

**Coverage**: Basic UI primitives (30% of needed UI kit)

#### 2. Chat & Communication (`src/components/`)
```
✅ ChatInterface.jsx       - Main chat container with message list
   ├── Message bubbles (user/assistant)
   ├── Tool dock (inline tool selection)
   ├── Feature inventory buttons
   ├── Input area with send button
   └── Quick action hints
   
✅ ToolPanel.jsx           - Floating tool/feature info panel
✅ ToolCard.jsx            - Display tool execution results in-chat
✅ Citations.jsx           - RAG citations display with modal
✅ ConfidenceBadge.jsx     - RAG confidence score indicator
```

**Coverage**: 90% complete for chat experience

#### 3. Navigation Components (`src/components/`)
```
✅ Sidebar.jsx             - Left navigation with conversations
   ├── Logo & brand
   ├── New conversation button
   ├── Recent conversations list (5 max)
   ├── Navigation links (Profile, Settings)
   ├── Sign-out button
   └── HIPAA badge + version info
```

**Coverage**: 80% complete (missing breadcrumbs, notifications)

#### 4. System Components (`src/components/`)
```
✅ ErrorBoundary.jsx       - React error boundary with fallback UI
✅ Toast.jsx               - Toast notification system
✅ PermissionGate.jsx      - RBAC permission guard component
✅ TwoFactorSettings.jsx   - 2FA/MFA configuration UI
```

**Coverage**: 75% complete (missing loading states, skeletons)

#### 5. Layout Shells (`src/layout/`)
```
✅ AppShell.jsx            - Authenticated app container
   ├── Sidebar integration
   ├── Top header bar with status
   ├── Main content area (Outlet)
   └── Mobile hamburger menu
   
✅ AuthShell.jsx           - Pre-auth container
   ├── Left: Marketing copy
   ├── Right: Auth forms (Outlet)
   └── Responsive grid layout
```

**Coverage**: 100% for basic shells

#### 6. Pages (`src/pages/`)
```
✅ Auth.jsx                - Login/signup forms with OAuth
✅ AuthCallback.jsx        - OAuth callback handler
✅ Onboarding.jsx          - First-time user onboarding
✅ Profile.jsx             - User profile view (read-only)
✅ ProfileSettings.jsx     - User profile editor with 2FA setup
✅ Settings.jsx            - App settings (theme, notifications)
✅ TwoFactorSetup.jsx      - 2FA enrollment flow (QR code)
✅ AuditLogs.jsx           - Audit log viewer (RBAC protected)
```

**Coverage**: 67% (missing 4 critical pages)

---

### ⚠️ MISSING COMPONENTS (9 Critical)

#### 1. **Loading & States** (HIGH PRIORITY)
```
❌ Spinner.jsx             - Loading spinner with sizes
❌ Skeleton.jsx            - Content skeleton loaders
❌ ProgressBar.jsx         - Progress indicators
❌ EmptyState.jsx          - Empty list/search states
```

**Use Cases**:
- Chat loading states
- Page transitions
- Data fetching
- Empty conversation lists

**Example**:
```jsx
// Spinner.jsx
export const Spinner = ({ size = 'md', color = 'accent' }) => (
  <div className={`spinner spinner-${size} spinner-${color}`} />
);

// Skeleton.jsx
export const Skeleton = ({ width, height, variant = 'text' }) => (
  <div 
    className={`skeleton skeleton-${variant}`}
    style={{ width, height }}
  />
);
```

#### 2. **Modal System** (HIGH PRIORITY)
```
❌ Modal.jsx               - Base modal container
❌ ConfirmDialog.jsx       - Confirmation dialogs
❌ Drawer.jsx              - Side drawer/sheet component
```

**Use Cases**:
- Settings dialogs
- Confirmation prompts (delete conversation, sign out)
- Mobile navigation drawer
- Tool detail views

**Example**:
```jsx
// Modal.jsx
export const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};
```

#### 3. **Form Components** (MEDIUM PRIORITY)
```
❌ Select.jsx              - Dropdown select
❌ Checkbox.jsx            - Checkbox with labels
❌ RadioGroup.jsx          - Radio button groups
❌ TextArea.jsx            - Multi-line text input
❌ FileUpload.jsx          - File upload with drag-drop
```

**Use Cases**:
- Profile settings forms
- Search filters
- Consent checkboxes
- File attachments in chat

#### 4. **Navigation Enhancements** (MEDIUM PRIORITY)
```
❌ Breadcrumbs.jsx         - Breadcrumb navigation
❌ TabNavigation.jsx       - Tab switcher component
❌ Dropdown.jsx            - Dropdown menu
```

**Use Cases**:
- Settings page sections (tabs)
- User menu dropdown
- Hierarchical navigation

#### 5. **Data Display** (LOW PRIORITY)
```
❌ Table.jsx               - Data table with sorting
❌ Badge.jsx               - Status badges
❌ Avatar.jsx              - User avatar component
❌ Tooltip.jsx             - Hover tooltips
```

**Use Cases**:
- Audit log table
- User status badges
- Profile avatars
- Help tooltips

---

## 🗺️ NAVIGATION & INFORMATION ARCHITECTURE

### Current Navigation Tree

```
CareDroid App
│
├── 🏠 HOME (Authenticated)
│   ├── Chat Interface ("/")
│   │   ├── Sidebar (conversations, tools)
│   │   ├── Message Thread
│   │   ├── Tool Dock
│   │   └── Input Area
│   │
│   └── Sub-Navigation
│       ├── Profile ("/profile") ✅
│       ├── Profile Settings ("/profile-settings") ✅
│       ├── App Settings ("/settings") ✅
│       ├── Audit Logs ("/audit-logs") ✅ [RBAC: Admin only]
│       ├── Help Center ("/help") ❌ MISSING
│       ├── Notifications ("/notifications") ❌ MISSING
│       └── Team Management ("/team") ❌ MISSING [RBAC: Admin]
│
├── 🔐 AUTH (Unauthenticated)
│   ├── Login/Signup ("/auth") ✅
│   ├── OAuth Callback ("/auth/callback") ✅
│   ├── Password Reset ("/auth/reset") ❌ MISSING
│   ├── Email Verification ("/auth/verify") ❌ MISSING
│   └── 2FA Verification ("/auth/2fa") ❌ MISSING
│
├── 🚀 ONBOARDING
│   ├── Welcome Tour ("/onboarding") ✅
│   ├── Role Selection ❌ (within onboarding, needs expansion)
│   └── Consent Flow ❌ MISSING (HIPAA, privacy policy)
│
└── 📄 LEGAL (Public)
    ├── Privacy Policy ("/privacy") ❌ MISSING
    ├── Terms of Service ("/terms") ❌ MISSING
    └── Consent History ("/consent-history") ❌ MISSING [Authenticated]
```

### Navigation Pattern Analysis

#### ✅ What Works Well
- Clear primary navigation in sidebar
- Logical grouping (Profile → Settings → Logs)
- Mobile hamburger menu for sidebar
- Protected routes with RBAC

#### ⚠️ What's Missing
1. **Breadcrumbs** for deep navigation paths
2. **Global search** (search conversations, tools)
3. **Notification center** (alerts, system messages)
4. **Help/Documentation** in-app access
5. **User menu** dropdown (instead of sidebar links)

#### 🎯 Recommended Navigation Improvements

```jsx
// Top Navigation Bar (Header)
┌─────────────────────────────────────────────────────┐
│ ☰  CareDroid Clinical AI    🔔  🔍  👤 John Doe ▼  │
│    [Breadcrumb > Path]       (3) [Search] [Menu]    │
└─────────────────────────────────────────────────────┘

// User Menu Dropdown (👤 John Doe ▼)
┌──────────────────────┐
│ 👤 Profile           │
│ ⚙️  Settings          │
│ 📊 Audit Logs        │
│ ❓ Help Center       │
│ ────────────────     │
│ 🚪 Sign Out          │
└──────────────────────┘

// Notification Center (🔔 with badge count)
┌─────────────────────────────────┐
│ 🔔 Notifications (3)     Mark all│
├─────────────────────────────────┤
│ ⚠️  System maintenance in 2h    │
│    2 minutes ago                │
├─────────────────────────────────┤
│ ✅ New feature: Lab Interpreter │
│    1 hour ago                   │
├─────────────────────────────────┤
│ 📄 New policy update available  │
│    Yesterday                    │
└─────────────────────────────────┘
```

---

## 📐 LAYOUT SHELLS & PAGE TEMPLATES

### Existing Layout Shells

#### 1. **AppShell** (Authenticated Container)

```jsx
┌────────────────────────────────────────────────────────┐
│  Sidebar   │  Header Bar                               │
│  (280px)   │  [Logo] [Health Status] [Auth Badge]      │
│            ├───────────────────────────────────────────┤
│            │                                            │
│  [Logo]    │                                            │
│            │                                            │
│  [New +]   │         Main Content Area                  │
│            │         <Outlet />                         │
│  Recent:   │         (Chat, Profile, Settings, etc.)    │
│  - Conv 1  │                                            │
│  - Conv 2  │                                            │
│            │                                            │
│  [Profile] │                                            │
│  [Settings]│                                            │
│  [Logout]  │                                            │
│            │                                            │
│  v1.0.0    │                                            │
└────────────┴────────────────────────────────────────────┘

Responsive Behavior:
- Desktop (>1024px): Sidebar always visible
- Tablet/Mobile (<1024px): Sidebar hidden by default, overlay on toggle
```

**Strengths**:
- Clean separation of navigation and content
- Mobile-responsive sidebar
- Health status indicator

**Gaps**:
- No breadcrumbs
- No notification center
- Header is static (could be sticky for mobile scrolling)

---

#### 2. **AuthShell** (Pre-Auth Container)

```jsx
┌────────────────────────────────────────────────────────┐
│                                                         │
│  ┌──────────────────┐  ┌──────────────────────┐       │
│  │  Marketing Copy  │  │    Auth Form         │       │
│  │                  │  │    <Outlet />         │       │
│  │  CareDroid       │  │                      │       │
│  │  Clinical AI     │  │  [Login/Signup]      │       │
│  │                  │  │                      │       │
│  │  ⚡ Evidence-based│  │  Email: [ ]          │       │
│  │  🔒 HIPAA-ready  │  │  Password: [ ]       │       │
│  │  🧠 Contextual   │  │                      │       │
│  │                  │  │  [Sign In] [OAuth]   │       │
│  └──────────────────┘  └──────────────────────┘       │
│                                                         │
└────────────────────────────────────────────────────────┘

Responsive Behavior:
- Desktop: Two-column grid layout
- Mobile: Stacked (marketing copy collapses to top banner)
```

**Strengths**:
- Engaging marketing copy for visitor conversion
- Clean auth forms
- OAuth integration

**Gaps**:
- No password strength indicator
- No "remember me" checkbox
- Missing password reset flow

---

### ❌ MISSING LAYOUT SHELLS (2)

#### 3. **SettingsShell** (Tabbed Settings Container)

```jsx
// Proposed: src/layout/SettingsShell.jsx

┌────────────────────────────────────────────────────────┐
│  ← Back to Chat          Settings                       │
├────────────────────────────────────────────────────────┤
│  [General] [Profile] [Security] [Notifications] [Team] │
├────────────────────────────────────────────────────────┤
│                                                         │
│          <Outlet /> (Settings page content)            │
│                                                         │
│          [Save Changes] [Cancel]                       │
│                                                         │
└────────────────────────────────────────────────────────┘

Routes:
- /settings/general
- /settings/profile
- /settings/security (2FA, password change)
- /settings/notifications
- /settings/team (admin only)
```

**Benefits**:
- Consistent settings UX
- Tab-based navigation for discoverability
- Reusable across settings pages

---

#### 4. **EmptyShell** (Minimal Public Pages)

```jsx
// Proposed: src/layout/PublicShell.jsx

┌────────────────────────────────────────────────────────┐
│  CareDroid Logo                        [Home] [Login]  │
├────────────────────────────────────────────────────────┤
│                                                         │
│               <Outlet /> (Legal content)               │
│                                                         │
│          (Privacy Policy, Terms, etc.)                 │
│                                                         │
├────────────────────────────────────────────────────────┤
│  Footer: © 2026 CareDroid | Privacy | Terms           │
└────────────────────────────────────────────────────────┘

Routes:
- /privacy
- /terms
- /help
```

---

## 🔄 USER FLOWS & JOURNEY MAPS

### Flow 1: New User Onboarding (First-Time Experience)

```
┌─────────────┐
│ 1. Landing  │  User visits app for first time
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 2. Sign Up  │  Email/password OR OAuth (Google/LinkedIn)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 3. Email    │  ❌ MISSING: Verify email address
│ Verification│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 4. Welcome  │  ✅ EXISTS: Onboarding.jsx
│ Tour        │  - Role selection (Student, Nurse, Physician, Admin)
└──────┬──────┘  - Feature highlights
       │          - Sample chat
       ▼
┌─────────────┐
│ 5. Consent  │  ❌ MISSING: HIPAA consent + privacy policy acceptance
│ Flow        │  - Required before accessing clinical tools
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 6. Chat     │  ✅ EXISTS: User lands on main chat interface
│ Interface   │
└─────────────┘
```

**Missing Steps**:
- Email verification page
- In-app consent flow with checkboxes
- Optional 2FA setup during onboarding

---

### Flow 2: Clinical Query with Tool Execution

```
┌─────────────┐
│ User types  │  "Calculate SOFA score for: PaO2/FiO2 180..."
│ message     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Backend     │  Intent classifier → identifies "sofa-calculator"
│ Classifies  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Tool        │  Execute SOFA calculation microservice
│ Orchestrator│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Display     │  ✅ ToolCard.jsx renders result in chat
│ Result      │  - Score: 7 (high risk)
└──────┬──────┘  - Interpretation
       │          - Citations
       ▼
┌─────────────┐
│ Follow-up   │  User can click citations, ask follow-up questions
│ Actions     │
└─────────────┘
```

**Strengths**:
- Seamless tool integration in chat
- Clear result display
- Citation support for credibility

**Gaps**:
- No tool execution progress indicator
- No option to "save" result for later review
- No export/share functionality

---

### Flow 3: Emergency Detection & Escalation

```
┌─────────────┐
│ User message│  "Patient unresponsive, pulse thready, BP 80/40"
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Emergency   │  NLP detects critical keywords + severity
│ Detector    │  → High severity: dispatch 911
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Alert UI    │  ❌ MISSING: Prominent emergency banner
│ Banner      │  "⚠️ CRITICAL: Dispatch 911 NOW"
└──────┬──────┘  - Action buttons: [Call 911] [Escalate to MD]
       │          - Persistent until acknowledged
       ▼
┌─────────────┐
│ User        │  User clicks [Call 911] or [Dismiss]
│ Action      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Audit Log   │  Action logged with timestamp, user, patient context
└─────────────┘
```

**Critical Gap**:
- No emergency alert UI component exists yet
- Backend detection exists, but frontend display is missing

**Proposed Component**:
```jsx
// EmergencyBanner.jsx
<div className="emergency-banner">
  <div className="emergency-icon">⚠️</div>
  <div className="emergency-content">
    <h3>CRITICAL EMERGENCY DETECTED</h3>
    <p>Patient requires immediate medical attention</p>
  </div>
  <div className="emergency-actions">
    <Button variant="critical" onClick={handleCall911}>
      📞 Call 911
    </Button>
    <Button variant="secondary" onClick={handleEscalate}>
      Escalate to MD
    </Button>
  </div>
</div>
```

---

### Flow 4: Multi-User Role-Based Access

```
┌─────────────┐
│ Admin       │  Navigate to Team Management page
│ User        │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Team        │  ❌ MISSING: /team page
│ Management  │  - List all users (table view)
└──────┬──────┘  - Assign roles: Student, Nurse, Physician, Admin
       │          - Manage permissions (22 available)
       ▼
┌─────────────┐
│ Edit User   │  Modal/drawer to edit user role
│ Modal       │  - Role dropdown
└──────┬──────┘  - Permission checkboxes
       │          - [Save] [Cancel]
       ▼
┌─────────────┐
│ Audit Log   │  Role change logged (who changed, when, old/new role)
└─────────────┘
```

**Implementation Needs**:
- Team management page (`src/pages/TeamManagement.jsx`)
- User table with role display
- Edit user modal
- Backend: `/api/users` CRUD endpoints

---

## 🎨 DESIGN SYSTEM & VISUAL LANGUAGE

### Design Tokens (CSS Variables)

```css
/* Color Palette */
:root {
  /* Backgrounds */
  --navy-bg: #0b1220;           /* Main app background */
  --navy-ink: #06080f;          /* Darker variant for cards */
  --surface-1: #131829;         /* Elevated surface */
  --surface-2: #1a2033;         /* More elevated */
  --surface-glass: rgba(26, 32, 51, 0.8);  /* Glass-morphism */
  
  /* Accents */
  --accent-cyan: #00FFFF;       /* Links, highlights */
  --accent-green: #00FF88;      /* Success, primary actions */
  --accent-purple: #A78BFA;     /* Secondary actions */
  --accent-gradient: linear-gradient(135deg, #00FF88, #00FFFF);
  
  /* Semantic Colors */
  --error: #FF6B6B;             /* Errors, critical alerts */
  --warning: #FFD166;           /* Warnings, medium alerts */
  --success: #00FF88;           /* Success states */
  --info: #00FFFF;              /* Informational */
  
  /* Text */
  --text-color: #f8fafc;        /* Primary text */
  --text-primary: #f8fafc;
  --text-muted: rgba(248, 250, 252, 0.6);   /* Secondary text */
  --muted-text: rgba(248, 250, 252, 0.6);
  
  /* Borders */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --panel-border: rgba(255, 255, 255, 0.1);
  
  /* Spacing */
  --space-2xs: 4px;
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  
  /* Radii */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  
  /* Shadows */
  --shadow-1: 0 2px 8px rgba(0, 0, 0, 0.2);
  --shadow-2: 0 4px 16px rgba(0, 0, 0, 0.3);
  --shadow-3: 0 8px 32px rgba(0, 0, 0, 0.4);
  
  /* Typography */
  --text-xs: 12px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 30px;
  --text-4xl: 36px;
}
```

### Typography Scale

```css
/* Font Family */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
               'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 
               'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Headings */
h1 { font-size: 36px; font-weight: 700; line-height: 1.2; }
h2 { font-size: 30px; font-weight: 700; line-height: 1.3; }
h3 { font-size: 24px; font-weight: 600; line-height: 1.4; }
h4 { font-size: 20px; font-weight: 600; line-height: 1.4; }
h5 { font-size: 18px; font-weight: 600; line-height: 1.4; }
h6 { font-size: 15px; font-weight: 600; line-height: 1.5; }

/* Body */
p, body { font-size: 15px; line-height: 1.6; }

/* Small */
small { font-size: 13px; }
```

### Component Variants

#### Button Styles
```css
/* Primary */
.btn-primary {
  background: linear-gradient(135deg, #00FF88, #00FFFF);
  color: #06080f;
  border: none;
  font-weight: 600;
}

/* Secondary */
.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #f8fafc;
}

/* Ghost */
.btn-ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--accent-cyan);
}

/* Critical/Danger */
.btn-danger {
  background: #FF6B6B;
  color: white;
  border: none;
}

/* Disabled */
.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

#### Card Styles
```css
/* Default Card */
.card {
  background: var(--surface-2);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  box-shadow: var(--shadow-1);
}

/* Subtle Card */
.card-subtle {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
}

/* Glass Card */
.card-glass {
  background: var(--surface-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}
```

### Animation Patterns

```css
/* Transitions */
.transition-all {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide In */
@keyframes slideInUp {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

/* Pulse (for loading) */
@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* Shimmer (for skeletons) */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
```

---

## 🚨 MISSING COMPONENTS & GAPS

### Critical (Blocking Production)

#### 1. **Legal Pages** (REQUIRED for App Store)
```
❌ PrivacyPolicy.jsx       (/privacy)
❌ TermsOfService.jsx      (/terms)
❌ ConsentFlow.jsx         (in-app consent)
❌ ConsentHistory.jsx      (/consent-history)
```

**Why Critical**: Apple/Google require privacy policy and terms before app submission. HIPAA requires explicit consent tracking.

**Effort**: 1-2 weeks (including legal review)

#### 2. **Notification System** (HIGH PRIORITY)
```
❌ NotificationCenter.jsx   (global notification dropdown)
❌ NotificationPreferences.jsx  (/settings/notifications)
❌ PushNotificationPrompt.jsx   (one-time permission request)
```

**Why Critical**: Medical apps require real-time alerts (emergency escalations, critical lab results).

**Effort**: 1 week

#### 3. **Offline Support UI** (HIGH PRIORITY)
```
❌ OfflineIndicator.jsx     (network status banner)
❌ SyncStatus.jsx           (data sync progress)
❌ OfflineWarning.jsx       (features unavailable when offline)
```

**Why Critical**: Healthcare settings often have poor connectivity. App must gracefully handle offline mode.

**Effort**: 2 weeks (including IndexedDB integration)

#### 4. **Emergency Alert UI** (HIGH PRIORITY)
```
❌ EmergencyBanner.jsx      (critical alert banner)
❌ EmergencyModal.jsx       (full-screen emergency modal)
❌ EscalationActions.jsx    (Call 911, Escalate to MD buttons)
```

**Why Critical**: Core feature of emergency detection system. Backend logic exists but no UI.

**Effort**: 3 days

---

### Important (Enhances UX)

#### 5. **Team Management** (RBAC Feature)
```
❌ TeamManagement.jsx       (/team)
❌ UserTable.jsx            (list all users with roles)
❌ EditUserModal.jsx        (edit user role and permissions)
❌ RoleSelector.jsx         (dropdown for 4 roles)
```

**Why Important**: Multi-user RBAC is a core feature. Admin users need to manage team members.

**Effort**: 1 week

#### 6. **Search & Discovery**
```
❌ GlobalSearch.jsx         (search bar in header)
❌ SearchResults.jsx        (search results page)
❌ ConversationSearch.jsx   (search within conversations)
```

**Why Important**: As conversation history grows, users need to find past queries quickly.

**Effort**: 1 week

#### 7. **Help & Documentation**
```
❌ HelpCenter.jsx           (/help)
❌ HelpArticle.jsx          (/help/:slug)
❌ TutorialTooltips.jsx     (first-time user guidance)
```

**Why Important**: Reduces support burden. Helps new users discover features.

**Effort**: 1 week (content creation separate)

#### 8. **Profile Enhancements**
```
❌ ProfileAvatar.jsx        (user avatar upload)
❌ ProfileBadges.jsx        (role badges, certifications)
❌ ActivityTimeline.jsx     (recent user activity)
```

**Why Important**: Makes profile page more engaging and informative.

**Effort**: 3 days

---

### Nice-to-Have (Future Enhancements)

#### 9. **Chart & Data Visualization**
```
❌ LineChart.jsx            (trends over time)
❌ BarChart.jsx             (comparison charts)
❌ PieChart.jsx             (distribution)
```

**Use Cases**: Analytics dashboard, SOFA score trends, usage metrics.

**Effort**: 1 week

#### 10. **Export & Sharing**
```
❌ ExportChat.jsx           (export conversation as PDF)
❌ ShareDialog.jsx          (share tool result with team)
```

**Use Cases**: Workflow collaboration, reporting, documentation.

**Effort**: 3 days

---

## 📱 MOBILE-SPECIFIC CONSIDERATIONS

### Responsive Breakpoints

```css
/* Breakpoint system */
:root {
  --bp-mobile: 640px;      /* Phones */
  --bp-tablet: 768px;      /* Tablets */
  --bp-desktop: 1024px;    /* Laptop */
  --bp-wide: 1280px;       /* Desktop monitors */
}

/* Media queries */
@media (max-width: 640px) {
  /* Mobile styles */
  .container { padding: var(--space-md); }
  .sidebar { display: none; }  /* Overlay mode */
  h1 { font-size: 24px; }
}

@media (min-width: 641px) and (max-width: 1024px) {
  /* Tablet styles */
  .container { padding: var(--space-lg); }
  .sidebar { width: 240px; }
}

@media (min-width: 1025px) {
  /* Desktop styles */
  .container { padding: var(--space-xl); }
  .sidebar { width: 280px; }
}
```

### Mobile Navigation Pattern

**Current**: Hamburger menu → Slide-out sidebar (overlay)

**Recommended**: Add bottom navigation bar for mobile

```jsx
// MobileBottomNav.jsx (NEW)
<nav className="mobile-bottom-nav">
  <NavItem icon="💬" label="Chat" to="/" />
  <NavItem icon="🔔" label="Alerts" to="/notifications" />
  <NavItem icon="🔍" label="Search" to="/search" />
  <NavItem icon="⚙️" label="Settings" to="/settings" />
</nav>
```

**CSS**:
```css
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--surface-glass);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
}

@media (min-width: 1025px) {
  .mobile-bottom-nav { display: none; }  /* Hide on desktop */
}
```

### Touch Targets

All interactive elements must meet minimum touch target size:

```css
/* Minimum 44x44px for WCAG AAA compliance */
button, a, input, .interactive {
  min-height: 44px;
  min-width: 44px;
}

/* Increase spacing on mobile */
@media (max-width: 640px) {
  .btn {
    padding: 14px 24px;  /* Larger padding for thumb taps */
    font-size: 16px;     /* Prevent iOS zoom on focus */
  }
}
```

### Mobile Gestures

Implement swipe gestures for mobile UX:

```jsx
// SwipeableConversation.jsx
<Swipeable
  onSwipeLeft={() => handleArchive(conversationId)}
  onSwipeRight={() => handleDelete(conversationId)}
>
  <ConversationItem {...props} />
</Swipeable>
```

### Mobile-Specific Features

#### Pull-to-Refresh
```jsx
// Implement in ChatInterface.jsx
const handleRefresh = useCallback(() => {
  // Reload conversation history
  fetchMessages(conversationId);
}, [conversationId]);

<PullToRefresh onRefresh={handleRefresh}>
  <MessageList messages={messages} />
</PullToRefresh>
```

#### Haptic Feedback
```jsx
// For critical actions (delete, emergency alert)
const triggerHaptic = () => {
  if (window.navigator.vibrate) {
    window.navigator.vibrate([100, 50, 100]);  // Short pulse pattern
  }
};
```

---

## ♿ ACCESSIBILITY & INTERNATIONALIZATION

### Accessibility (WCAG 2.1 Level AA)

#### Current Status
- ✅ Semantic HTML (mostly)
- ✅ Color contrast (dark theme with high contrast)
- ⚠️ Keyboard navigation (partially implemented)
- ❌ Screen reader support (missing ARIA labels)
- ❌ Focus management
- ❌ Skip links

#### Required Improvements

##### 1. **Keyboard Navigation**
```jsx
// All interactive elements must be keyboard accessible
<button
  onClick={handleClick}
  onKeyPress={(e) => e.key === 'Enter' && handleClick()}
  tabIndex={0}
>
  Action
</button>

// Skip to main content link
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

##### 2. **ARIA Labels**
```jsx
// Add descriptive labels for screen readers
<button
  aria-label="Send message"
  aria-describedby="send-hint"
>
  Send
</button>
<span id="send-hint" className="sr-only">
  Sends your message to CareDroid AI
</span>

// Screen reader only text
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
```

##### 3. **Focus Management**
```jsx
// Trap focus in modals
import { FocusTrap } from '@headlessui/react';

<FocusTrap active={isOpen}>
  <Modal>
    <button>First focusable</button>
    <button>Last focusable</button>
  </Modal>
</FocusTrap>

// Restore focus after modal closes
const previousFocus = useRef(null);

const openModal = () => {
  previousFocus.current = document.activeElement;
  setIsOpen(true);
};

const closeModal = () => {
  setIsOpen(false);
  previousFocus.current?.focus();
};
```

##### 4. **Live Regions**
```jsx
// Announce dynamic content changes
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {statusMessage}
</div>

// For urgent alerts (emergency)
<div role="alert" aria-live="assertive">
  {emergencyMessage}
</div>
```

##### 5. **Form Accessibility**
```jsx
// Proper label association
<label htmlFor="email-input">Email Address</label>
<input
  id="email-input"
  type="email"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby="email-error"
/>
{hasError && (
  <span id="email-error" role="alert">
    {errorMessage}
  </span>
)}
```

---

### Internationalization (i18n)

#### Current Status
- ❌ No i18n library integrated
- ❌ All text is hardcoded in English
- ❌ No locale/language switcher

#### Recommended: React-i18next

```bash
npm install i18next react-i18next
```

```jsx
// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          "sidebar.newConversation": "New Conversation",
          "chat.placeholder": "Ask CareDroid anything clinical...",
          "auth.signIn": "Sign In",
          "auth.signUp": "Sign Up",
          "emergency.critical": "CRITICAL EMERGENCY DETECTED"
        }
      },
      es: {
        translation: {
          "sidebar.newConversation": "Nueva Conversación",
          "chat.placeholder": "Pregúntale a CareDroid cualquier cosa clínica...",
          "auth.signIn": "Iniciar Sesión",
          "auth.signUp": "Registrarse",
          "emergency.critical": "EMERGENCIA CRÍTICA DETECTADA"
        }
      },
      fr: {
        translation: {
          "sidebar.newConversation": "Nouvelle Conversation",
          "chat.placeholder": "Demandez à CareDroid n'importe quoi clinique...",
          // ...
        }
      }
    },
    lng: 'en',  // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false  // React already escapes
    }
  });

export default i18n;
```

```jsx
// Usage in components
import { useTranslation } from 'react-i18next';

function Sidebar() {
  const { t } = useTranslation();
  
  return (
    <button>
      {t('sidebar.newConversation')}
    </button>
  );
}
```

#### Language Switcher Component

```jsx
// src/components/LanguageSwitcher.jsx
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' }
  ];
  
  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      aria-label="Select language"
    >
      {languages.map(({ code, name }) => (
        <option key={code} value={code}>
          {name}
        </option>
      ))}
    </select>
  );
};
```

---

## 🎯 IMPLEMENTATION PRIORITY MATRIX

### Phase 1: Critical Blockers (Week 1-2)

| Component/Feature | Priority | Effort | Blocking |
|-------------------|----------|--------|----------|
| Legal Pages (Privacy, Terms) | 🔴 Critical | 1 week | App Store submission |
| Consent Flow | 🔴 Critical | 3 days | HIPAA compliance |
| Emergency Alert UI | 🔴 Critical | 3 days | Core feature |
| Loading States (Spinner, Skeleton) | 🟡 High | 2 days | UX polish |
| Modal System | 🟡 High | 3 days | Many features depend on it |

**Total Effort**: 2 weeks

---

### Phase 2: Core UX Enhancements (Week 3-4)

| Component/Feature | Priority | Effort | Impact |
|-------------------|----------|--------|--------|
| Notification Center | 🟡 High | 1 week | Real-time alerts |
| Offline Indicator | 🟡 High | 2 days | Critical for healthcare |
| Team Management Page | 🟡 High | 1 week | RBAC feature |
| Form Components (Select, Checkbox, etc.) | 🟢 Medium | 3 days | Multiple forms |
| User Menu Dropdown | 🟢 Medium | 1 day | Navigation improvement |

**Total Effort**: 2 weeks

---

### Phase 3: Search & Discovery (Week 5)

| Component/Feature | Priority | Effort | Impact |
|-------------------|----------|--------|--------|
| Global Search | 🟢 Medium | 3 days | Discoverability |
| Conversation Search | 🟢 Medium | 2 days | Find past queries |
| Breadcrumbs | 🟢 Medium | 1 day | Navigation context |
| Tab Navigation | 🟢 Medium | 1 day | Settings organization |

**Total Effort**: 1 week

---

### Phase 4: Polish & Nice-to-Haves (Week 6+)

| Component/Feature | Priority | Effort | Impact |
|-------------------|----------|--------|--------|
| Help Center | 🟢 Medium | 1 week | Reduces support |
| Profile Enhancements | 🔵 Low | 3 days | Engagement |
| Charts & Visualization | 🔵 Low | 1 week | Analytics |
| Export & Sharing | 🔵 Low | 3 days | Collaboration |
| i18n Integration | 🔵 Low | 1 week | Global expansion |

**Total Effort**: 3 weeks

---

## 📊 COMPLETION DASHBOARD

### Current Component Coverage

```
Total Components Needed: 28
Components Implemented: 19
Components Missing: 9

Completion: 68% (19/28)
```

### By Category

| Category | Implemented | Missing | Coverage |
|----------|-------------|---------|----------|
| **Core UI** | 3/8 | 5 | 38% |
| **Chat & Communication** | 5/5 | 0 | 100% ✅ |
| **Navigation** | 1/4 | 3 | 25% |
| **System Components** | 4/6 | 2 | 67% |
| **Layout Shells** | 2/4 | 2 | 50% |
| **Pages** | 8/12 | 4 | 67% |

### Page Coverage

```
Total Pages Needed: 12
Pages Implemented: 8
Pages Missing: 4

Completion: 67% (8/12)
```

**Missing Pages**:
1. Privacy Policy (/privacy)
2. Terms of Service (/terms)
3. Team Management (/team)
4. Help Center (/help)

---

## 🛠️ NEXT STEPS & ACTION ITEMS

### Immediate Actions (This Week)

1. **Legal Documents** (BLOCKING)
   - [ ] Hire healthcare legal counsel
   - [ ] Draft privacy policy (HIPAA-specific)
   - [ ] Draft terms of service
   - [ ] Create in-app consent flow

2. **Emergency UI** (BLOCKING)
   - [ ] Design EmergencyBanner component
   - [ ] Implement emergency modal
   - [ ] Add escalation action buttons
   - [ ] Test with backend emergency detector

3. **Loading States** (UX CRITICAL)
   - [ ] Create Spinner.jsx (3 sizes)
   - [ ] Create Skeleton.jsx (multiple variants)
   - [ ] Add loading states to ChatInterface
   - [ ] Add loading states to page transitions

### Week 2-3 Actions

4. **Modal System**
   - [ ] Build base Modal.jsx component
   - [ ] Create ConfirmDialog.jsx
   - [ ] Create Drawer.jsx for mobile
   - [ ] Refactor existing dialogs to use new system

5. **Notification Center**
   - [ ] Design notification dropdown UI
   - [ ] Implement NotificationCenter.jsx
   - [ ] Add notification preferences page
   - [ ] Integrate with backend notification service

6. **Team Management**
   - [ ] Create TeamManagement.jsx page
   - [ ] Build UserTable.jsx component
   - [ ] Create EditUserModal.jsx
   - [ ] Add role selector dropdown

### Week 4-5 Actions

7. **Search & Discovery**
   - [ ] Implement GlobalSearch.jsx
   - [ ] Add search bar to header
   - [ ] Create search results page
   - [ ] Add conversation search filter

8. **Offline Support**
   - [ ] Design offline indicator banner
   - [ ] Implement sync status component
   - [ ] Add offline warning for unavailable features
   - [ ] Test offline behavior

---

## 📖 APPENDIX

### A. Complete File Structure (Proposed)

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.jsx ✅
│   │   ├── Card.jsx ✅
│   │   ├── Input.jsx ✅
│   │   ├── Select.jsx ❌
│   │   ├── Checkbox.jsx ❌
│   │   ├── RadioGroup.jsx ❌
│   │   ├── TextArea.jsx ❌
│   │   ├── FileUpload.jsx ❌
│   │   ├── Spinner.jsx ❌
│   │   ├── Skeleton.jsx ❌
│   │   ├── ProgressBar.jsx ❌
│   │   ├── Modal.jsx ❌
│   │   ├── Dropdown.jsx ❌
│   │   ├── Tooltip.jsx ❌
│   │   ├── Badge.jsx ❌
│   │   ├── Avatar.jsx ❌
│   │   └── Table.jsx ❌
│   │
│   ├── chat/
│   │   ├── ChatInterface.jsx ✅
│   │   ├── MessageBubble.jsx (extract from ChatInterface)
│   │   ├── MessageList.jsx (extract from ChatInterface)
│   │   ├── ToolDock.jsx (extract from ChatInterface)
│   │   ├── ToolPanel.jsx ✅
│   │   ├── ToolCard.jsx ✅
│   │   ├── Citations.jsx ✅
│   │   └── ConfidenceBadge.jsx ✅
│   │
│   ├── navigation/
│   │   ├── Sidebar.jsx ✅
│   │   ├── MobileBottomNav.jsx ❌
│   │   ├── UserMenu.jsx ❌
│   │   ├── Breadcrumbs.jsx ❌
│   │   ├── TabNavigation.jsx ❌
│   │   └── GlobalSearch.jsx ❌
│   │
│   ├── alerts/
│   │   ├── EmergencyBanner.jsx ❌
│   │   ├── EmergencyModal.jsx ❌
│   │   ├── EscalationActions.jsx ❌
│   │   └── OfflineIndicator.jsx ❌
│   │
│   ├── notifications/
│   │   ├── NotificationCenter.jsx ❌
│   │   ├── NotificationItem.jsx ❌
│   │   └── NotificationPreferences.jsx ❌
│   │
│   ├── team/
│   │   ├── UserTable.jsx ❌
│   │   ├── EditUserModal.jsx ❌
│   │   ├── RoleSelector.jsx ❌
│   │   └── PermissionCheckboxes.jsx ❌
│   │
│   ├── legal/
│   │   ├── ConsentFlow.jsx ❌
│   │   ├── ConsentCheckbox.jsx ❌
│   │   └── ConsentHistory.jsx ❌
│   │
│   ├── system/
│   │   ├── ErrorBoundary.jsx ✅
│   │   ├── Toast.jsx ✅
│   │   ├── PermissionGate.jsx ✅
│   │   ├── TwoFactorSettings.jsx ✅
│   │   ├── EmptyState.jsx ❌
│   │   ├── LoadingScreen.jsx ❌
│   │   └── SyncStatus.jsx ❌
│   │
│   └── profile/
│       ├── ProfileAvatar.jsx ❌
│       ├── ProfileBadges.jsx ❌
│       └── ActivityTimeline.jsx ❌
│
├── layout/
│   ├── AppShell.jsx ✅
│   ├── AuthShell.jsx ✅
│   ├── SettingsShell.jsx ❌
│   └── PublicShell.jsx ❌
│
├── pages/
│   ├── Auth.jsx ✅
│   ├── AuthCallback.jsx ✅
│   ├── Onboarding.jsx ✅
│   ├── Profile.jsx ✅
│   ├── ProfileSettings.jsx ✅
│   ├── Settings.jsx ✅
│   ├── TwoFactorSetup.jsx ✅
│   ├── AuditLogs.jsx ✅
│   ├── TeamManagement.jsx ❌
│   ├── HelpCenter.jsx ❌
│   ├── PrivacyPolicy.jsx ❌
│   ├── TermsOfService.jsx ❌
│   ├── Notifications.jsx ❌
│   └── Search.jsx ❌
│
├── contexts/
│   ├── UserContext.jsx ✅
│   ├── ThemeContext.jsx ❌
│   └── OfflineContext.jsx ❌
│
├── services/
│   ├── offlineService.js ❌
│   ├── syncService.js ❌
│   ├── notificationService.js ❌
│   └── analyticsService.js ❌
│
└── hooks/
    ├── useAuth.js ✅
    ├── usePermissions.js ✅
    ├── useOffline.js ❌
    ├── useNotifications.js ❌
    └── useMediaQuery.js ❌
```

### B. Design Token Reference Card

```jsx
// Quick copy-paste design tokens

/* Colors */
--navy-bg: #0b1220
--accent-cyan: #00FFFF
--accent-green: #00FF88
--text-color: #f8fafc
--error: #FF6B6B

/* Spacing */
--space-sm: 12px
--space-md: 16px
--space-lg: 24px

/* Radii */
--radius-md: 12px
--radius-lg: 16px

/* Shadows */
--shadow-1: 0 2px 8px rgba(0, 0, 0, 0.2)

/* Typography */
--text-sm: 13px
--text-base: 15px
--text-lg: 18px
```

### C. Accessibility Checklist

```markdown
- [ ] All images have alt text
- [ ] All interactive elements are keyboard accessible (Tab, Enter, Esc)
- [ ] Focus indicators are visible (outline or ring)
- [ ] Color contrast meets WCAG AA (4.5:1 for normal text)
- [ ] Forms have proper labels and error messages
- [ ] Headings follow semantic hierarchy (h1 → h2 → h3)
- [ ] ARIA landmarks (banner, main, navigation, contentinfo)
- [ ] Live regions for dynamic content
- [ ] Skip links for keyboard users
- [ ] Modal focus trap
- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
```

---

## 📞 DOCUMENT METADATA

**Author**: Product & Engineering Team  
**Version**: 2.0  
**Last Updated**: January 31, 2026  
**Next Review**: February 14, 2026  
**Status**: Living Document

**Change Log**:
- v2.0 (Jan 31, 2026): Complete UX architecture documentation
- v1.0 (Jan 15, 2026): Initial layout specification

---

**End of Document**

