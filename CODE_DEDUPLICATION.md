# Code Deduplication Summary

## Changes Made

### 1. Created Custom Hook for Toast Management
**File**: `src/hooks/useToast.js` (NEW)
- Extracted duplicate toast notification logic
- Provides `toasts`, `addToast()`, and `dismissToast()` utilities
- Returns a clean interface: `{ toasts, addToast, dismissToast }`

### 2. Eliminated Duplicate Code in App.jsx
**File**: `src/App.jsx` (MODIFIED)

#### Removed Duplication #1: AuthPage Toast Logic
**Before**:
```javascript
// In AuthPage (lines 19-24)
const [toasts, setToasts] = useState([]);
const addToast = (message, type = 'info') => {
  const id = Date.now();
  setToasts((prev) => [...prev, { id, message, type }]);
  setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
};
```

**After**:
```javascript
// In AuthPage (line 18)
const { toasts, addToast, dismissToast } = useToast();
```

#### Removed Duplication #2: ChatPage Toast Logic
**Before**:
```javascript
// In ChatPage (lines 246-251)
const [toasts, setToasts] = useState([]);
const addToast = (message, type = 'info') => {
  const id = Date.now();
  setToasts((prev) => [...prev, { id, message, type }]);
  setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
};
```

**After**:
```javascript
// In ChatPage (line 231)
const { toasts, addToast, dismissToast } = useToast();
```

#### Removed Duplication #3: Toast Dismissal Callbacks
**Before**:
```javascript
// AuthPage line 108
<Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

// ChatPage line 552
<Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
```

**After**:
```javascript
// AuthPage line 108
<Toast toasts={toasts} onDismiss={dismissToast} />

// ChatPage line 552
<Toast toasts={toasts} onDismiss={dismissToast} />
```

## Impact

### Before Cleanup
- `src/App.jsx`: 637 lines
- Toast logic defined **2 times** (AuthPage + ChatPage)
- Duplicate inline dismissal callbacks in multiple places
- Maintenance burden: Changes to toast behavior required updating 2+ locations

### After Cleanup
- `src/App.jsx`: 626 lines (11 lines removed)
- `src/hooks/useToast.js`: 17 lines (new file)
- Toast logic defined **1 time** (in custom hook)
- Single source of truth for toast management
- Cleaner code: Components only 1-2 lines for toast setup

## Benefits

✅ **DRY Principle**: Don't Repeat Yourself - single toast implementation  
✅ **Maintainability**: Change toast behavior once, applies everywhere  
✅ **Reusability**: useToast hook can be imported in new components  
✅ **Readability**: AuthPage and ChatPage are now ~15 lines shorter  
✅ **Consistency**: All toast notifications use same interface  

## Files Modified
- `src/App.jsx` (11 lines removed, 1 import added)
- `src/hooks/useToast.js` (NEW - 17 lines)

## Testing Recommendations
1. Verify toast notifications appear when signing in (AuthPage)
2. Verify toast notifications appear in chat when sending messages (ChatPage)
3. Verify toast notifications dismiss after 3 seconds
4. Verify dismissal button works (onDismiss callback)

## Next Steps for Cleanup
Future opportunities to reduce duplication:
- Extract conversation management to `useConversations` hook
- Extract message handling to `useMessages` hook
- Extract clinical tools array to separate constant file
- Consider extracting common UI patterns (sidebar, input area, etc.)
