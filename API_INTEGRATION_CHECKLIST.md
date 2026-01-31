# API Integration Checklist

## Status: Build Complete ✅

The frontend build is complete and running. The following API endpoints are referenced by the new components and need to be verified or implemented in the backend.

## Notification [Endpoints](https://localhost:8000/api/notifications)

### Get Notifications
- **Endpoint**: `GET /api/notifications`
- **Auth**: Bearer token required
- **Query Params**: `limit=50`, `offset=0`
- **Response**: 
```json
{
  "data": [
    {
      "id": "string",
      "title": "string",
      "message": "string",
      "type": "info|warning|error|critical|alert",
      "read": boolean,
      "actionUrl": "string?",
      "timestamp": "ISO-8601",
      "icon": "string?"
    }
  ],
  "total": number,
  "unreadCount": number
}
```
- **Used by**: NotificationCenter.jsx, AppShell.jsx
- **Status**: ⏳ Needs Implementation

### Mark Notification as Read
- **Endpoint**: `PATCH /api/notifications/{id}/read`
- **Auth**: Bearer token required
- **Body**: `{}`
- **Response**: `{ success: boolean }`
- **Used by**: NotificationCenter.jsx
- **Status**: ⏳ Needs Implementation

### Delete Notification
- **Endpoint**: `DELETE /api/notifications/{id}`
- **Auth**: Bearer token required
- **Response**: `{ success: boolean }`
- **Used by**: NotificationCenter.jsx, NotificationToast.jsx
- **Status**: ⏳ Needs Implementation

### Get Notification Preferences
- **Endpoint**: `GET /api/notifications/preferences`
- **Auth**: Bearer token required
- **Response**:
```json
{
  "userId": "string",
  "emailNotifications": boolean,
  "pushNotifications": boolean,
  "criticalOnly": boolean,
  "categories": {
    "alerts": boolean,
    "updates": boolean,
    "messages": boolean,
    "announcements": boolean
  }
}
```
- **Used by**: NotificationPreferences.jsx (in TODO)
- **Status**: ⏳ Needs Implementation

### Update Notification Preferences
- **Endpoint**: `PUT /api/notifications/preferences`
- **Auth**: Bearer token required
- **Body**:
```json
{
  "emailNotifications": boolean,
  "pushNotifications": boolean,
  "criticalOnly": boolean,
  "categories": { ... }
}
```
- **Response**: Preferences object
- **Used by**: NotificationPreferences.jsx (in TODO)
- **Status**: ⏳ Needs Implementation

### Notification Stream (SSE)
- **Endpoint**: `GET /api/notifications/stream`
- **Auth**: Bearer token required
- **Stream Type**: Server-Sent Events (SSE)
- **Event Data**:
```json
{
  "type": "new_notification",
  "data": {
    "id": "string",
    "title": "string",
    "message": "string",
    "type": "info|warning|error|critical|alert"
  }
}
```
- **Used by**: NotificationService.js (real-time updates)
- **Status**: ⏳ Needs Implementation

### Test Notification
- **Endpoint**: `POST /api/notifications/test`
- **Auth**: Bearer token required
- **Body**: 
```json
{
  "title": "Test Notification",
  "message": "This is a test",
  "type": "info"
}
```
- **Response**: `{ success: boolean, notificationId: string }`
- **Used by**: Testing/Admin (optional)
- **Status**: ⏳ Needs Implementation

## Team Management Endpoints

### Get Team Users
- **Endpoint**: `GET /api/team/users`
- **Auth**: Bearer token + `MANAGE_USERS` permission
- **Query Params**: `limit=50`, `offset=0`, `search?=""`
- **Response**:
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "admin|manager|clinician|viewer",
      "status": "active|inactive|pending",
      "joinedDate": "ISO-8601",
      "lastActive": "ISO-8601?",
      "department": "string?"
    }
  ],
  "total": number
}
```
- **Used by**: TeamManagement.jsx, UserTable.jsx
- **Status**: ⏳ Needs Implementation

### Update User Role
- **Endpoint**: `PUT /api/team/users/{id}`
- **Auth**: Bearer token + `MANAGE_USERS` permission
- **Body**:
```json
{
  "role": "admin|manager|clinician|viewer",
  "permissions": ["string"]
}
```
- **Response**: Updated user object
- **Used by**: EditUserModal.jsx, RoleSelector.jsx
- **Status**: ⏳ Needs Implementation

### Remove User from Team
- **Endpoint**: `DELETE /api/team/users/{id}`
- **Auth**: Bearer token + `MANAGE_USERS` permission
- **Response**: `{ success: boolean }`
- **Used by**: UserTable.jsx (delete action)
- **Status**: ⏳ Needs Implementation

### Send Team Invitation
- **Endpoint**: `POST /api/team/invite`
- **Auth**: Bearer token + `MANAGE_USERS` permission
- **Body**:
```json
{
  "email": "string",
  "role": "admin|manager|clinician|viewer",
  "message": "string?"
}
```
- **Response**: `{ success: boolean, invitationId: string }`
- **Used by**: TeamManagement.jsx (invite action)
- **Status**: ⏳ Needs Implementation

## Consent Management Endpoints

### Record Consent
- **Endpoint**: `POST /api/consent/record`
- **Auth**: None (can be anonymous during onboarding) or Bearer token
- **Body**:
```json
{
  "consents": {
    "hipaa_authorization": boolean,
    "privacy_policy": boolean,
    "terms_of_service": boolean,
    "data_sharing": boolean,
    "marketing_communications": boolean
  },
  "consentDate": "ISO-8601",
  "ipAddress": "string"
}
```
- **Response**: 
```json
{
  "success": boolean,
  "consentId": "string",
  "timestamp": "ISO-8601"
}
```
- **Used by**: ConsentFlow.jsx
- **Status**: ⏳ Needs Implementation

### Get Consent History
- **Endpoint**: `GET /api/consent/history`
- **Auth**: Bearer token (show own history, or MANAGE_USERS for team)
- **Query Params**: `userId?="", limit=50`
- **Response**:
```json
{
  "data": [
    {
      "id": "string",
      "userId": "string",
      "consents": { ... },
      "timestamp": "ISO-8601",
      "ipAddress": "string",
      "userAgent": "string?",
      "version": "number"
    }
  ],
  "total": number
}
```
- **Used by**: ConsentHistory.jsx
- **Status**: ⏳ Needs Implementation

## Offline Support

### IndexedDB Schema
The following object stores are created automatically by the app:

1. **conversations** - Chat history and messages
2. **encounters** - Clinical encounter data
3. **guidelines** - Medical guidelines cache
4. **users** - Team member information cache
5. **pending-sync** - Changes waiting to be synced

### Service Worker Caching Strategies

1. **Cache-First** (Static Assets):
   - HTML files
   - CSS files
   - JavaScript bundles
   - Image assets
   - Fonts

2. **Network-First** (API Calls):
   - `/api/*` endpoints
   - Fallback to IndexedDB cache if network unavailable
   - Automatic sync when reconnected

### Periodic Sync
- **Background Sync Tag**: `sync_conversations`
- **Sync Interval**: 15 minutes (browser-dependent)
- **Synced Data**: Pending conversations, encounter updates

## Frontend Component Status

| Component | Type | Status | Tested |
|-----------|------|--------|--------|
| NotificationCenter | Feature | ✅ Built | ⏳ Pending |
| NotificationToast | Feature | ✅ Built | ⏳ Pending |
| NotificationPreferences | Feature | ✅ Built | ⏳ Pending |
| TeamManagement | Feature | ✅ Built | ⏳ Pending |
| TeamMemberList | Feature | ✅ Built | ⏳ Pending |
| EditUserModal | Feature | ✅ Built | ⏳ Pending |
| ConsentFlow | Feature | ✅ Built | ⏳ Pending |
| ConsentHistory | Feature | ✅ Built | ⏳ Pending |
| PrivacyPolicy | Legal | ✅ Built | ⏳ Pending |
| TermsOfService | Legal | ✅ Built | ⏳ Pending |
| HeaderNav | Navigation | ✅ Built | ⏳ Pending |
| Breadcrumbs | Navigation | ✅ Built | ⏳ Pending |
| UserMenu | Navigation | ✅ Built | ⏳ Pending |
| OfflineIndicator | Feature | ✅ Built | ⏳ Pending |
| SyncStatus | Feature | ✅ Built | ⏳ Pending |
| OfflineWarning | Feature | ✅ Built | ⏳ Pending |

## Backend Implementation Priority

### Phase 1: Critical API Endpoints (Required for Core Functionality)
1. ✅ Authentication (existing)
2. ⏳ `/api/consent/record` - ConsentFlow submission
3. ⏳ `/api/team/users` - TeamManagement list
4. ⏳ `/api/notifications` - Notification feed

### Phase 2: Enhanced Features
5. ⏳ `/api/notifications/stream` - Real-time notifications (SSE)
6. ⏳ `/api/team/users/{id}` - Update user roles
7. ⏳ `/api/consent/history` - Audit trail
8. ⏳ `/api/notifications/preferences` - User preferences

### Phase 3: Additional Features
9. ⏳ `/api/team/invite` - Send invitations
10. ⏳ `/api/notifications/test` - Testing endpoint

## Testing Checklist

### Frontend Routes
- [ ] `/` - Home page (should redirect to /auth if not logged in)
- [ ] `/auth` - Login page
- [ ] `/privacy` - Privacy policy (public, uses PublicShell)
- [ ] `/terms` - Terms of service (public, uses PublicShell)
- [ ] `/consent` - Consent flow (public or during onboarding)
- [ ] `/consent-history` - Consent audit trail (auth required)
- [ ] `/team` - Team management (requires MANAGE_USERS permission)
- [ ] `/team/members` - Team member list view (if different from /team)
- [ ] `/notifications` - Notification center (auth required)

### Component Functionality
- [ ] NotificationCenter displays notifications from API
- [ ] NotificationToast shows incoming notifications
- [ ] UserMenu displays current user info
- [ ] Breadcrumbs show current location
- [ ] TeamManagement CRUD operations (create, read, update, delete)
- [ ] ConsentFlow form validation and submission
- [ ] OfflineIndicator shows when offline
- [ ] SyncStatus shows sync progress
- [ ] HeaderNav displays notification badge count

### Offline Functionality
- [ ] Service Worker registers on app load
- [ ] Static assets cache properly
- [ ] App works when network disconnected
- [ ] Data syncs when reconnected
- [ ] OfflineIndicator appears when offline
- [ ] Sync status shows progress

### Cross-Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (tested via responsive design)

## Known Issues & TODOs

1. **HeaderNav User Display**: Currently uses localStorage, should connect to UserContext
2. **Notification Service**: Needs backend SSE implementation
3. **Permission Gates**: Team route requires MANAGE_USERS, needs UserContext integration
4. **Avatar Upload**: Not yet implemented (UI ready)
5. **Sync Verification**: Service Worker caching needs verification
6. **Error Handling**: Add proper error boundaries and error pages
7. **Loading States**: Add skeleton loading for list views
8. **Form Validation**: Add more comprehensive validation messages
9. **Accessibility Testing**: Browser testing needed
10. **Performance**: Monitor bundle size and optimize if needed

## Quick Start Commands

```bash
# Build the frontend
npm run build

# Run development server (frontend on :8000)
npm run dev

# Run backend server (on :3000 by default, or configured port)
cd backend && npm run start:dev

# Run both servers together (if configured)
npm run start:all

# Test the build
npm run preview

# Run tests (if configured)
npm run test
```

## Next Steps

1. **Implement Backend Endpoints**: Create the API endpoints listed in this document
2. **Test Routes**: Navigate to each route and verify it loads correctly
3. **Test API Integration**: Verify notifications, team management, and consent endpoints work
4. **Test Offline Mode**: Verify Service Worker caching and sync functionality
5. **Performance Optimization**: Monitor bundle size, optimize as needed
6. **Security Audit**: Verify HTTPS, CSP, CORS settings
7. **Accessibility Audit**: WCAG 2.1 Level AA compliance verification
8. **User Acceptance Testing**: Test with actual users
9. **Production Deployment**: Deploy to staging, then production

## Questions & Support

For questions about component usage, see:
- [COMPONENT_INTEGRATION_GUIDE.md](COMPONENT_INTEGRATION_GUIDE.md)
- Component JSDoc comments in source files
- [COMPLETE_UX_LAYOUT_ARCHITECTURE.md](COMPLETE_UX_LAYOUT_ARCHITECTURE.md) for detailed architecture

