# CareDroid Routing - Quick Reference

## Current URL Structure (FIXED ✅)

### For Unauthenticated Users
```
/ ........................ Welcome page with "Go to Login" button
/auth ..................... Login/Register/2FA/SSO form
```

### For Authenticated Users  
```
/chat ..................... Main dashboard (messages + clinical tools)
/auth ..................... Auto-redirects to /chat (if already logged in)
/ ........................ Auto-redirects to /chat
```

## How Authentication Works

```
1. User visits http://localhost:8000/
   → Shows: WelcomePage (hero, login button)
   
2. Click "Go to Login" button
   → Navigate to /auth
   → Shows: Auth.jsx (login form with multiple auth methods)
   
3. Submit credentials (or use dev bypass: test@dev.local / dev)
   → onAuthSuccess() callback triggers
   → setAuthToken() stores token in state & localStorage
   → Navigate to /chat (automatic)
   → Shows: ChatPage (main app dashboard)
   
4. User authenticated
   → /chat displays chat interface, tools, sidebar
   → Click "Sign Out" → return to /auth
   → localStorage cleared, back to login
```

## Dev Bypass (Testing Only)

Use these credentials without real backend:
```yaml
Email: test@dev.local
Password: dev
```

Automatically logs in and navigates to `/chat` with dev token from `appConfig.js`.

## The AppRoutes Component

Located in: `src/App.jsx` (lines 576-617)

```javascript
function AppRoutes() {
  const { isAuthenticated, isLoading } = useUser();
  
  if (!isAuthenticated) {
    // Render welcome + auth routes
    return <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  } else {
    // Render authenticated routes
    return <Routes>
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/" element={<Navigate to="/chat" />} />
      <Route path="*" element={<Navigate to="/chat" />} />
    </Routes>
  }
}
```

## What Was Fixed

**File**: `src/App.jsx`
- **Old Size**: 1033 lines (with duplicate code)
- **New Size**: 637 lines (clean)
- **Removed**: ~400 lines of dead code and duplicate AppRoutes function
- **Problem**: Two route definitions conflicting
- **Solution**: Kept correct one, deleted orphaned code

## Debugging Routes

### Check Current Route
```javascript
import { useLocation } from 'react-router-dom';

function MyComponent() {
  const location = useLocation();
  console.log('Current route:', location.pathname);
}
```

### Navigate Programmatically
```javascript
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/chat'); // Go to dashboard
  };
}
```

### Check Authentication Status
```javascript
import { useUser } from './contexts/UserContext';

function MyComponent() {
  const { isAuthenticated, user, authToken } = useUser();
  
  if (isAuthenticated) {
    console.log('User is logged in:', user);
  }
}
```

## Common Navigation Patterns

### After Login
```javascript
const handleAuthSuccess = (token, user) => {
  setAuthToken(token);
  setUser(user);
  navigate('/chat'); // ← Always navigate here
};
```

### Sign Out
```javascript
const handleSignOut = () => {
  signOut(); // Clears token, user, localStorage
  navigate('/auth'); // ← Redirect to login
};
```

### Protect a Route
```javascript
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useUser();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
}
```

## Troubleshooting

### Issue: Route not found
**Check**: Does the route exist in AppRoutes()? If not, add it.

### Issue: Stuck on login
**Check**: Is auth token saved? Look at localStorage in DevTools (Application tab).

### Issue: Auto-redirects to /chat when not logged in
**Check**: Is token in localStorage but invalid? Clear localStorage and restart.

```javascript
// Clear manually in console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Issue: Page blank/white screen
**Check**: Browser console for errors. Look for:
- Missing component imports
- Undefined routes
- Auth context errors

## File References

- **Main App Logic**: [src/App.jsx](src/App.jsx)
- **Auth Context**: [src/contexts/UserContext.jsx](src/contexts/UserContext.jsx)  
- **Auth Form**: [src/pages/Auth.jsx](src/pages/Auth.jsx)
- **Main Dashboard**: [src/pages/ChatPage.jsx](src/pages/ChatPage.jsx) (defined in App.jsx)
- **Welcome Page**: [src/pages/WelcomePage.jsx](src/pages/WelcomePage.jsx) (defined in App.jsx)

## Related Documentation

For detailed root cause analysis, see: [ROUTING_FIX_REPORT.md](ROUTING_FIX_REPORT.md)
