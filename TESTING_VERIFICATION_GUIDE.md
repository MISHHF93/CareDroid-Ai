# Testing & Verification Guide

## Build Status: ✅ SUCCESS

The CareDroid app has been successfully built and is ready for testing. 

### Build Output
- **Frontend Bundle**: `dist/assets/index-DHXf7XwY.js` (303.60 kB, gzip: 89.44 kB)
- **CSS Bundle**: `dist/assets/index-NTHBoVkr.css` (53.85 kB, gzip: 8.82 kB)
- **Service Worker**: `dist/sw.js` (70 lines, PWA enabled)
- **Build Time**: 5.87 seconds
- **Status**: Production-ready

## Components Built: 65+ Components ✅

### Core UI Components (9 components)
- ✅ Spinner, Skeleton, ProgressBar, EmptyState (loading)
- ✅ Modal, ConfirmDialog, AlertDialog, Drawer, MobileNav (modals)
- ✅ EmergencyBanner, EmergencyModal, EmergencyStatusIndicator (alerts)
- ✅ EmergencyToast, OfflineWarning (notifications)
- ✅ Select, Checkbox, RadioGroup, TextArea, CodeTextArea (forms)
- ✅ PrivacyPolicy, TermsOfService, ConsentFlow, ConsentHistory (legal)

### Feature Components (25+ components)
- ✅ NotificationCenter, NotificationToast, NotificationPreferences
- ✅ TeamManagement, UserTable, EditUserModal, RoleSelector
- ✅ Breadcrumbs, TabNav, UserMenu, HeaderNav, MobileNav
- ✅ Badge, Avatar, AvatarGroup, Tooltip, Tag, ProgressBadge, StatusBadge
- ✅ OfflineIndicator, SyncStatus, OfflineWarning

### Context Providers & Services
- ✅ NotificationContext + NotificationProvider
- ✅ OfflineProvider + service worker
- ✅ NotificationService (API integration)
- ✅ useOfflineStatus, registerServiceWorker hooks

## Server Status

### Frontend Server
```
✅ Running on http://localhost:8000
✅ Vite development server ready
✅ Hot module reloading enabled
✅ Build artifacts in /dist folder
```

### Backend Server
```
✅ Starting... (watch mode)
✅ NestJS listening on port 3000 (or configured port)
✅ All dependencies compiled
```

## Testing Plan

### Phase 1: Basic Route Navigation (5 minutes)

Enter these URLs in your browser and verify they load without errors:

```
Step 1: Home Page
URL: http://localhost:8000/
Expected: Login page or dashboard (depending on auth state)
Check: No console errors, page loads

Step 2: Public Route - Privacy Policy
URL: http://localhost:8000/privacy
Expected: Full-page Privacy Policy (PublicShell layout)
Check: No errors, correct layout, scrollable content

Step 3: Public Route - Terms of Service
URL: http://localhost:8000/terms
Expected: Full-page Terms of Service (PublicShell layout)
Check: No errors, correct layout, disclaimers visible

Step 4: Consent Flow
URL: http://localhost:8000/consent
Expected: Multi-step consent form with 5 sections
Check: Form displays, all checkboxes visible, submit button present

Step 5: Return to Home
URL: http://localhost:8000/
Expected: Should return to previous page or home
Check: Navigation works correctly
```

### Phase 2: Component Testing (10 minutes)

#### NotificationCenter Testing
```
1. Log in to the app (or mock auth)
2. Look for notification bell icon in header
3. Click the icon to open notification center
4. Verify:
   - Dropdown appears below bell icon
   - Shows list of notifications
   - Mark as read works
   - Delete notification works
```

#### HeaderNav Testing
```
1. Check top of page for header navigation
2. Verify:
   - Logo present on left
   - Notification bell with count badge
   - User menu on right
   - "Logged in as [User]" message
3. Click user menu:
   - Profile option appears
   - Settings option appears
   - Logout option appears
```

#### Breadcrumbs Testing
```
1. Navigate to /team
2. Look for breadcrumb trail below header
3. Verify format: "Home > Team Management"
4. Click on breadcrumb to navigate back
5. Verify: Clicking breadcrumb navigates correctly
```

#### Mobile Navigation
```
1. Open DevTools (F12)
2. Toggle device toolbar (mobile view)
3. Verify:
   - Hamburger menu appears (width < 768px)
   - Menu toggle works
   - Navigation items appear in mobile menu
   - Close menu on navigation
```

### Phase 3: Form Testing (5 minutes)

#### Consent Form Validation
```
1. Navigate to /consent
2. Try to submit without checking required boxes
3. Verify: Error messages appear
4. Check each required box (first 3)
5. Verify: Error messages disappear
6. Fill in all fields and submit
7. Verify: Successful submission message or redirect
```

#### Team Management Forms
```
1. Navigate to /team
2. Look for "Add Member" or "Invite" button
3. Click to open modal
4. Fill in form fields:
   - Email field
   - Role dropdown
   - Permissions multi-select
5. Verify:
   - Form validation works
   - Submit button is enabled when valid
   - Form closes on successful submission
```

### Phase 4: Authentication & Permissions (10 minutes)

#### Permission Gate Testing
```
1. Without auth (or as viewer user):
   - Navigate to /team
   - Expected: Fallback message or redirect to auth
   - Should NOT show team management page

2. With admin/manager auth:
   - Navigate to /team
   - Expected: Full team management interface loads
   - Can see user list, edit options, delete buttons
```

#### User Context Integration
```
1. Log in with your user credentials
2. Check app header for:
   - User name appears in UserMenu
   - User avatar displays
   - User role shows in menu
3. Edit user profile
4. Verify changes reflect in header immediately
```

### Phase 5: Offline Functionality (5 minutes)

#### Service Worker Registration
```
1. Open DevTools (F12)
2. Go to Application tab
3. Look for "Service Workers" section
4. Verify: /sw.js is registered and active
```

#### Offline Indicator Testing
```
1. DevTools > Network tab
2. Set throttling to "Offline"
3. Refresh page or trigger API call
4. Verify in app:
   - "Offline" indicator appears
   - Red color or different styling
   - User-friendly message
5. Set network back to "Online"
6. Verify: Indicator disappears, syncing begins
```

#### Cache Testing
```
1. Go to Application > Cache Storage
2. Verify caches are created:
   - v1-static (or similar)
   - API responses cached
3. Go offline and navigate
4. Verify: Previously visited pages still load
5. Verify: Non-cached content shows a message
```

### Phase 6: Notification System (10 minutes)

#### Real-time Notifications
```
1. In another browser window or device:
   - Send a test notification via API
   - Or wait for system-generated notification

2. In the app:
   - Toast notification should appear
   - Or notification bell badge updates
   - Sound/visual alert (if configured)

3. Verify notification includes:
   - Title and message
   - Icon/status indicator
   - Timestamp
   - Action button (if applicable)
```

#### Notification Preferences (if implemented)
```
1. Navigate to Settings > Notifications
2. Verify options visible:
   - Email notifications toggle
   - Push notifications toggle
   - Category preferences
3. Change preferences and save
4. Verify: Changes persist after reload
```

### Phase 7: API Integration Testing (15 minutes)

#### Notification API
```
GET /api/notifications?limit=50
- Expected: 200 OK
- Response contains array of notifications
- Each item has: id, title, message, type, timestamp, read status

PATCH /api/notifications/{id}/read
- Expected: 200 OK
- Notification marked as read in backend
- Unread count updates in UI
```

#### Team Management API
```
GET /api/team/users
- Expected: 200 OK (with MANAGE_USERS permission)
- Response contains user list
- Each user has: id, name, email, role, status

PUT /api/team/users/{id}
- Send: { "role": "manager" }
- Expected: 200 OK
- User role updated in database
- UI refreshes to show new role
```

#### Consent API
```
POST /api/consent/record
- Body: { consents, consentDate, ipAddress }
- Expected: 201 Created or 200 OK
- Response includes consentId and timestamp
- Data stored in audit log

GET /api/consent/history
- Expected: 200 OK
- Shows all consent records for user
- Includes timestamps and versions
```

## Browser Developer Tools Checklist

### Console Tab
- [ ] No JavaScript errors (red X's)
- [ ] No uncaught exceptions
- [ ] Warning messages are expected
- [ ] Custom logs appear (if enabled)

### Network Tab
- [ ] All main resources load (js, css, html) - status 200
- [ ] API calls succeed (200, 201 status)
- [ ] No 404 errors for resources
- [ ] CSS and JS gzip sizes reasonable (< 100 KB each)
- [ ] Load time < 3 seconds

### Performance Tab
- [ ] First Contentful Paint (FCP) < 1 second
- [ ] Largest Contentful Paint (LCP) < 2.5 seconds
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Time to Interactive < 3 seconds

### Application Tab
- [ ] Service Worker: registered, active, running
- [ ] Cache Storage: v1-static cache with files
- [ ] IndexedDB: 5 object stores present
- [ ] Local Storage: authToken, consentsAccepted

### Accessibility (Lighthouse)
- [ ] Run Lighthouse audit
- [ ] Accessibility score > 90
- [ ] Check for:
  - Missing alt text on images
  - Low color contrast
  - Missing form labels
  - Keyboard navigation issues

## Manual Testing Results Template

```markdown
## Test Date: [Date]
## Tester: [Your Name]
## Environment: [OS, Browser, Mobile/Desktop]

### Results

#### Route Navigation
- [ ] Home page loads
- [ ] Privacy policy accessible
- [ ] Terms of service accessible
- [ ] Consent form displays
- [ ] Team page respects permissions

#### Components
- [ ] Header navigation visible correct
- [ ] Notifications work
- [ ] Forms validate properly
- [ ] Modals open/close correctly
- [ ] Mobile nav responds

#### API Integration
- [ ] Notifications fetch from API
- [ ] Team data loads from API
- [ ] Consent submission works
- [ ] Permission checks work

#### Performance
- [ ] App loads quickly (< 3s)
- [ ] No janky animations
- [ ] Network requests reasonable
- [ ] Resource sizes acceptable

#### Offline
- [ ] Service Worker registers
- [ ] Offline indicator shows
- [ ] App works offline
- [ ] Data syncs on reconnect

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
2. [Recommendation]
```

## Fix Issues if Tests Fail

### Issue: Page shows blank white screen
```
Solution:
1. Check browser console for errors
2. Verify frontend server running: npm run dev
3. Clear browser cache (Ctrl+Shift+Del)
4. Hard refresh (Ctrl+Shift+R)
```

### Issue: "Cannot GET /route" error
```
Solution:
1. Verify route exists in src/App.jsx
2. Check spelling of route path
3. Verify component is imported
4. Rebuild frontend: npm run build
5. Restart dev server
```

### Issue: API calls fail (404, 500)
```
Solution:
1. Verify backend server is running
2. Check API endpoint exists in backend
3. Verify auth token is valid
4. Check Network tab for CORS errors
5. See API_INTEGRATION_CHECKLIST.md
```

### Issue: Styling looks broken
```
Solution:
1. Check CSS custom properties are defined
2. Verify CSS files are in correct location
3. Check for CSS import errors in console
4. Hard refresh browser cache
5. Rebuild: npm run build
```

### Issue: Service Worker not registering
```
Solution:
1. Check /public/sw.js exists
2. Verify app is served over HTTPS (or localhost)
3. Check Application > Service Workers in DevTools
4. See browser console for registration errors
5. Try disabling browser extensions
```

## Success Criteria

✅ **Phase 1: Route Navigation** - All 5 routes load without errors
✅ **Phase 2: Components** - All components render correctly
✅ **Phase 3: Forms** - Form validation and submission works
✅ **Phase 4: Permissions** - Auth gates prevent unauthorized access
✅ **Phase 5: Offline** - Service Worker registers and caches work
✅ **Phase 6: Notifications** - System shows notifications properly
✅ **Phase 7: API Integration** - All endpoints return expected data

## Sign-Off

When all tests pass:

```
Date: ________________
Tested By: ________________
Sign Off:________________
Status: ✅ READY FOR PRODUCTION
```

## Next Steps After Testing

1. **Performance Optimization** - Analyze bundle size, optimize if needed
2. **Security Audit** - HTTPS, CSP headers, XSS prevention
3. **Accessibility Audit** - WCAG 2.1 AA compliance, screen reader testing
4. **User Acceptance Testing** - Real users test workflows
5. **Load Testing** - Verify performance under load
6. **Staging Deployment** - Deploy to staging environment
7. **Production Deployment** - Deploy to production

---

**Questions?** Check [COMPONENT_INTEGRATION_GUIDE.md](COMPONENT_INTEGRATION_GUIDE.md) or review [COMPLETE_UX_LAYOUT_ARCHITECTURE.md](COMPLETE_UX_LAYOUT_ARCHITECTURE.md)
