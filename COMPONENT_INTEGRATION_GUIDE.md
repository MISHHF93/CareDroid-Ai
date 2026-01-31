# Component Integration Guide

## Overview
This guide explains how the new UI components have been integrated into CareDroid.

## File Structure

### Component Library (45+ components)

```
src/
├── components/
│   ├── ui/                    # Core UI components
│   ├── forms/                 # Form components
│   ├── alerts/                # Alert & emergency components
│   ├── navigation/            # Navigation components
│   │   ├── Navigation.jsx      # Breadcrumbs, TabNav, UserMenu, HeaderNav
│   │   └── Navigation.css
│   ├── data-display/          # Data display components
│   │   ├── DataDisplay.jsx     # Badge, Avatar, Tooltip, Tag
│   │   └── DataDisplay.css
│   ├── notifications/         # Notification system
│   │   ├── NotificationCenter.jsx
│   │   ├── NotificationToast.jsx
│   │   ├── NotificationCenter.css
│   │   └── NotificationToast.css
│   └── offline/               # Offline support
│       ├── OfflineSupport.jsx
│       └── OfflineSupport.css
├── contexts/
│   ├── NotificationContext.js      # Notification state
│   ├── OfflineProvider.jsx         # Offline wrapper
│   └── (other contexts...)
├── services/
│   ├── NotificationService.js      # API calls
│   └── (other services...)
├── pages/
│   ├── team/
│   │   ├── TeamManagement.jsx       # Team management page
│   │   └── TeamManagement.css
│   ├── legal/
│   │   ├── PrivacyPolicy.jsx
│   │   ├── TermsOfService.jsx
│   │   ├── ConsentFlow.jsx
│   │   ├── ConsentHistory.jsx
│   │   └── LegalPage.css
│   └── (other pages...)
└── layout/
    ├── AppShell.jsx                 # Updated with HeaderNav
    ├── PublicShell.jsx              # Public pages layout
    └── (other layouts...)
```

## Provider Setup

The app is now wrapped with multiple providers for global state management:

```jsx
<UserProvider>
  <NotificationProvider>
    <OfflineProvider>
      <AppContent />
    </OfflineProvider>
  </NotificationProvider>
</UserProvider>
```

### NotificationProvider
- Manages global notification state
- Provides `useNotifications()` hook
- Auto-removes non-critical notifications after 5 seconds

### OfflineProvider
- Detects network status
- Shows offline indicators and sync status
- Manages IndexedDB for local caching
- Implements service worker strategies

## Routes Integration

New routes have been added:

```
/team                      → Team Management (requires MANAGE_USERS permission)
/privacy                   → Privacy Policy (public)
/terms                     → Terms of Service (public)
/consent                   → Consent Flow (public)
/consent-history           → Consent History (public)
/notifications             → Notification Center (requires auth)
/settings/notifications    → Notification Preferences (requires auth)
```

## Service Worker

The service worker (`public/sw.js`) provides:
- **Cache-first strategy** for static assets
- **Network-first strategy** for API calls
- **IndexedDB** for offline data persistence
- **Periodic sync** for background data synchronization
- **Push notifications** support

## Component Usage Examples

### Notifications

```jsx
import { useNotificationActions } from './hooks/useNotificationActions';

function MyComponent() {
  const { success, error, critical } = useNotificationActions();

  const handleSave = async () => {
    try {
      await api.save(data);
      success('Saved!', 'Your changes have been saved.');
    } catch (err) {
      error('Error', 'Failed to save. Please try again.');
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### Navigation

```jsx
import { Breadcrumbs, TabNav, UserMenu, HeaderNav } from './components/navigation';

// Breadcrumbs (auto-generated from route)
<Breadcrumbs />

// Tab navigation
<TabNav 
  tabs={[
    { id: 'tab1', label: 'Settings', icon: '⚙️' },
    { id: 'tab2', label: 'Profile', icon: '👤' }
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>

// User menu
<UserMenu user={userInfo} />

// Full header
<HeaderNav user={userInfo} notificationCount={5} />
```

### Data Display

```jsx
import { Badge, Avatar, Tooltip, Tag } from './components/data-display';

// Badge variants
<Badge variant="success" label="Active" icon="✓" />
<Badge variant="error" label="Error" removable onRemove={() => {}} />

// Avatar with status
<Avatar name="John Doe" size="lg" status="online" />

// Tooltip
<Tooltip content="Click to view details" position="top">
  <button>Hover me</button>
</Tooltip>

// Tag
<Tag label="Clinical" color="blue" />
```

### Forms

```jsx
import { Select, Checkbox, RadioGroup, TextArea } from './components/forms';

// Select with search
<Select
  options={[{ value: '1', label: 'Option 1' }]}
  value={selected}
  onChange={setSelected}
/>

// Checkbox group
<CheckboxGroup
  label="Select options"
  items={[
    { id: '1', label: 'Option 1' },
    { id: '2', label: 'Option 2' }
  ]}
/>

// Radio group
<RadioGroup
  items={items}
  value={selected}
  onChange={setSelected}
/>

// Textarea with auto-resize
<TextArea
  value={text}
  onChange={setText}
  maxLength={500}
/>
```

### Offline Support

```jsx
import { useOfflineStatus } from './components/offline';

function MyComponent() {
  const { isOnline, isSyncing, syncData } = useOfflineStatus();

  return (
    <>
      {!isOnline && <p>You are offline</p>}
      {isSyncing && <p>Syncing data...</p>}
      <button onClick={syncData}>Sync Now</button>
    </>
  );
}
```

## Backend API Integration

The following endpoints are referenced in the new components:

### Notifications
- `GET /api/notifications?limit=50` - Get notification history
- `PATCH /api/notifications/{id}/read` - Mark as read
- `DELETE /api/notifications/{id}` - Delete notification
- `GET /api/notifications/preferences` - Get preferences
- `PUT /api/notifications/preferences` - Update preferences
- `GET /api/notifications/stream` - SSE stream for real-time notifications
- `POST /api/notifications/test` - Send test notification

### Team Management
- `GET /api/team/users` - Get all team members
- `PUT /api/team/users/{id}` - Update user role/permissions
- `DELETE /api/team/users/{id}` - Remove user from team
- `POST /api/team/invite` - Send invitation

### Consent
- `POST /api/consent/record` - Record consent
- `GET /api/consent/history` - Get consent audit trail

## Styling System

All components use CSS custom properties:

```css
/* Colors */
--navy-bg: #0b1220
--surface-2: rgba(15, 23, 42, 0.6)
--text-color: #f8fafc
--muted-text: rgba(248, 250, 252, 0.5)
--accent-1: #00ffff
--accent-2: #00ff88
--error: #ff6b6b
--panel-border: rgba(255, 255, 255, 0.1)

/* Spacing */
--space-1 through --space-8 (4px to 48px)

/* Typography */
--font-11 through --font-36

/* Radius */
--radius-sm: 6px
--radius-md: 12px
--radius-lg: 16px
--radius-xl: 24px

/* Shadows */
--shadow-1, --shadow-2, --shadow-3
```

## Accessibility Features

All components include:
- ✅ WCAG 2.1 Level AA compliance
- ✅ Keyboard navigation (Tab, Arrow keys, Enter, Esc)
- ✅ ARIA labels and roles
- ✅ Focus management
- ✅ High contrast ratios
- ✅ Reduced motion support

## Build & Deployment

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm preview

# With backend
npm run start:all
```

## Testing Checklist

- [ ] All routes load without errors
- [ ] Notification system works (real-time updates)
- [ ] Team management CRUD operations
- [ ] Legal pages display correctly
- [ ] Offline detection and sync working
- [ ] Service worker registered
- [ ] Components responsive on mobile
- [ ] Keyboard navigation works throughout app
- [ ] Screen reader compatible

## Known Limitations

1. **Notification Stream**: Requires backend SSE implementation
2. **Offline Caching**: Limited to browser's IndexedDB capacity (~50MB)
3. **Service Worker**: Requires HTTPS in production
4. **Avatar Upload**: Image upload feature not implemented yet
5. **Sync**: Periodic sync task requires browser's Periodic Background Sync API

## Next Steps

1. **Backend Implementation**: Create API endpoints listed above
2. **Testing**: Run build and test all routes
3. **Performance**: Monitor bundle size and optimize if needed
4. **Customization**: Adjust colors, spacing, and typography in CSS variables
5. **Monitoring**: Set up error tracking and analytics

For questions or issues, refer to the component JSDoc comments or check the COMPLETE_UX_LAYOUT_ARCHITECTURE.md file.
