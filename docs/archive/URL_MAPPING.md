# CareDroid App - Complete URL Mapping

## URL Inventory & Route Status

### ✅ CURRENTLY WORKING ROUTES

| URL | Component | Type | Status |
|-----|-----------|------|--------|
| `/` | WelcomePage (→ /chat when auth) | Public/Protected | ✅ DEFINED |
| `/auth` | AuthPage | Public | ✅ DEFINED |
| `/chat` | ChatPage (Main Dashboard) | Protected | ✅ DEFINED |

---

### ❌ BROKEN REFERENCES (Defined but not Routed)

| URL | Component File | Used By | Status |
|-----|---|---|-----|
| `/profile` | Profile.jsx | settings, sidebar | ❌ MISSING |
| `/profile-settings` | ProfileSettings.jsx | TwoFactorSetup.jsx | ❌ MISSING |
| `/settings` | Settings.jsx | BiometricSetup.jsx, NotificationPreferences | ❌ MISSING |
| `/notifications` | NotificationPreferences.jsx | Sidebar.jsx | ❌ MISSING |
| `/two-factor-setup` | TwoFactorSetup.jsx | TwoFactorSettings.jsx | ❌ MISSING |
| `/onboarding` | Onboarding.jsx | Internal flow | ❌ MISSING |
| `/biometric-setup` | BiometricSetup.jsx | Internal flow | ❌ MISSING |
| `/auth-callback` | AuthCallback.jsx | OAuth flow | ❌ MISSING |
| `/privacy` | PrivacyPolicy.jsx | Multiple links | ❌ MISSING |
| `/terms` | TermsOfService.jsx | Multiple links | ❌ MISSING |
| `/consent` | ConsentFlow.jsx or legal/ConsentFlow.jsx | ConsentHistory link | ❌ MISSING |
| `/consent-history` | legal/ConsentHistory.jsx | Public footer | ❌ MISSING |
| `/audit-logs` | AuditLogs.jsx | Permissions | ❌ MISSING |

---

### ⚠️ INCORRECT REFERENCES (Wrong URL)

| Wrong URL | Should Be | Used In | Issue |
|-----------|-----------|---------|-------|
| `/login` | `/auth` | ConsentFlow.jsx | Wrong route name |
| `/help` | - | PublicShell.jsx | No Help page created yet |
| `/gdpr` | - | Multiple | No GDPR page created yet |
| `/hipaa` | - | Multiple | No HIPAA page created yet |
| `/users` | - | PermissionGate comment | No User Management page |
| `/admin` | - | Not referenced | Admin panel not created |

---

## Recommended URL Structure

### Public Routes (Unauthenticated)
```
/ ..................... Welcome/Landing Page
/auth .................. Login/Sign Up/2FA Form
/privacy ............... Privacy Policy
/terms ................. Terms of Service
/gdpr .................. GDPR Notice
/hipaa ................. HIPAA Addendum
/help .................. Help Center
/consent-history ....... View Previous Consents
*  .................... Redirect to /
```

### Protected Routes (Authenticated)
```
/chat .................. Main Dashboard (Messages + Clinical Tools)
/profile ............... User Profile
/profile-settings ...... Profile Settings & Security
/settings .............. App Settings
/notifications ......... Notification Preferences
/two-factor-setup ...... Setup 2FA
/biometric-setup ....... Setup Biometrics
/onboarding ............ Initial Setup Flow
/audit-logs ............ Audit Log Viewer (Admin)
/consent ............... Consent Management
*  .................... Redirect to /chat
```

---

## Critical Fixes Needed

### 1. Fix Incorrect URL Reference
- **File**: `src/pages/ConsentFlow.jsx` (line 200)
- **Current**: `navigate('/login')`
- **Should be**: `navigate('/auth')`

### 2. Add Missing Routes to App.jsx
Currently only 3 routes defined for authenticated users.
Need to add 10+ more routes (see above list).

### 3. Create Missing Pages
- `/gdpr` - GDPR Notice page (new)
- `/hipaa` - HIPAA Explanation page (new)
- `/help` - Help Center page (new)
- `/users` - User Management page (new, admin only)
- `/admin` - Admin Dashboard (new)

### 4. Remove Orphaned Components
Check if these are actually used or just legacy:
- Any old/duplicate page components
- Legacy auth methods

---

## URL Usage Heatmap

### Most Referenced URLs
1. `/` - 15+ references (redirects, home links)
2. `/auth` - 4 references (login flow)
3. `/chat` - 1 reference (authenticated default)
4. `/privacy` - 5+ links across pages
5. `/terms` - 5+ links across pages
6. `/settings` - 4 navigate calls
7. `/profile-settings` - 2 navigate calls
8. `/notifications` - 1 reference
9. `/consent` - 1 reference in legal

### Unused URLs
- `/admin`
- `/users`
- `/help`
- `/gdpr`
- `/hipaa`

---

## Implementation Plan

### Phase 1: Fix Immediate Breaks
1. ✅ Add all missing routes to App.jsx AppRoutes component
2. ✅ Fix `/login` → `/auth` in ConsentFlow.jsx
3. ✅ Create stub pages for `/gdpr`, `/hipaa`, `/help`

### Phase 2: Verify Links
1. Test all navigate() calls go to defined routes
2. Test all Link to={} reference defined routes
3. Test all authentication guards work

### Phase 3: Add Route Guards
1. Protect authenticated routes with auth check
2. Public routes accessible without auth
3. Admin routes check permissions

### Phase 4: Documentation
1. ✅ This mapping document
2. Add comments in App.jsx explaining each route section
3. Update README with URL structure

---

## Files to Update

**App.jsx**
- Add missing routes (11 authenticated routes)
- Add route guards for admin/protected pages
- Organize routes by type (public, protected, admin)

**ConsentFlow.jsx** (line 200)
- Change `/login` to `/auth`

**New Files Needed**
- Create GDPR page component
- Create HIPAA page component  
- Create Help page component
- Create User Management page component (Admin)
- Create Admin Dashboard component

---

## Testing Checklist

After implementing these changes:

- [ ] Navigate to `/` → Shows Welcome
- [ ] Navigate to `/auth` → Shows Login form
- [ ] Login successful → Redirect to `/chat`
- [ ] Click "Profile" → Navigate to `/profile` ✓
- [ ] Click "Settings" → Navigate to `/settings` ✓
- [ ] Click "Notifications" → Navigate to `/notifications` ✓
- [ ] Click "Privacy" footer link → Navigate to `/privacy` ✓
- [ ] Click "Terms" footer link → Navigate to `/terms` ✓
- [ ] Try `/gdpr` → Shows GDPR page ✓
- [ ] Try `/hipaa` → Shows HIPAA page ✓
- [ ] Try `/help` → Shows Help page ✓
- [ ] Try `/admin` without admin role → Redirects to `/chat`
- [ ] Invalid URL → Auto-redirects appropriately

---

## Notes

**Current State**: Routing is severely incomplete with only 3 routes defined while 13+ pages exist.

**Root Cause**: App.jsx routing was never fully configured during the frontend rebuild.

**Impact**: Users can't access most application features despite pages being built.

**Priority**: HIGH - This blocks basic app usability.
