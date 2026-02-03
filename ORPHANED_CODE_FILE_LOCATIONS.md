# Orphaned Code - Quick Reference & File Locations

## 🗺️ COMPLETE ORPHANED CODE MAP

### 1️⃣ MARK FOR DELETION (Delete These Files)

**These files are not used anywhere and can be safely deleted:**

```
DELETE THESE 5 FILES:

1. src/TestApp.jsx
   Status: Orphaned test component
   Lines: ~50
   Used By: Nobody
   Delete Command: rm src/TestApp.jsx

2. src/components/AppRoute.jsx  
   Status: Unused layout wrapper
   Lines: ~40
   Used By: Nobody
   Delete Command: rm src/components/AppRoute.jsx

3. src/pages/legal/PrivacyPolicy.jsx
   Status: Duplicate (root version used instead)
   Lines: ~200+
   Used By: Nobody
   Delete Command: rm src/pages/legal/PrivacyPolicy.jsx
   Note: Use src/pages/PrivacyPolicy.jsx instead

4. src/pages/legal/TermsOfService.jsx
   Status: Duplicate (root version used instead)
   Lines: ~270+
   Used By: Nobody
   Delete Command: rm src/pages/legal/TermsOfService.jsx
   Note: Use src/pages/TermsOfService.jsx instead

5. src/pages/legal/ConsentFlow.jsx
   Status: Duplicate (root version used instead)
   Lines: ~100+
   Used By: Nobody
   Delete Command: rm src/pages/legal/ConsentFlow.jsx
   Note: Use src/pages/ConsentFlow.jsx instead
```

---

### 2️⃣ READY TO ADOPT (Currently Unused, Ready to Use)

**These exist and are fully functional - just need to be imported/used:**

```
READY TO ADOPT - READY NOW:

1. src/hooks/useNotificationActions.js
   Status: ✅ COMPLETE & READY
   Lines: ~120
   Current Usage: 0 places
   Action: Import & use in pages
   Example: import { useNotificationActions } from '../hooks/useNotificationActions';
   Features: success(), error(), warning(), info(), critical(), etc.

2. src/utils/logger.ts
   Status: ✅ COMPLETE & READY
   Lines: ~67
   Current Usage: 0 places
   Action: Import & use in services/components
   Example: import logger from '../utils/logger';
   Features: logger.info(), .warn(), .error(), .debug()

3. src/components/offline/OfflineSupport.jsx
   Status: ✅ COMPLETE & READY
   Lines: ~350
   Current Usage: 0 visual components
   Action: Import & render UI components
   Example: import { OfflineIndicator } from './components/offline/OfflineSupport';
   Exports: OfflineIndicator, SyncStatus, OfflineWarning, useOfflineStatus(), useCacheMonitor()

4. src/pages/team/TeamManagement.jsx
   Status: ✅ COMPLETE & READY
   Lines: ~520
   Current Usage: 0 places
   Action: Add route + import in App.jsx
   Example: <Route path="/team" element={<TeamManagement />} />
   Features: Team CRUD, roles, permissions, search, invite, audit

QUICK ADOPTION CHECKLIST:
☐ Copy each item above's import line into appropriate files
☐ Use the exported functions/components
☐ Test each feature works
☐ Delete old code that's replaced by these
```

---

### 3️⃣ ARCHIVE/KEEP (For Future Use)

**These are built but not currently needed - keep them:**

```
KEEP FOR FUTURE REFERENCE:

1. src/layout/AppShell.jsx
   Status: Built but not in current routing
   Lines: ~80
   Reason: Could wrap authenticated routes if we want layout consistency
   Keep Because: Useful design pattern reference

2. src/layout/AuthShell.jsx  
   Status: Built but not in current routing
   Lines: ~60
   Reason: Could wrap auth pages if we want layout consistency
   Keep Because: Useful design pattern reference

3. src/layout/PublicShell.jsx
   Status: Built but not in current routing
   Lines: ~80
   Reason: Could wrap public pages if we want layout consistency
   Keep Because: Already exported in App.jsx, might be used

Note: These are optional - current inline approach works fine too
```

---

### 4️⃣ ADOPTION WORKFLOW BY PRIORITY

**PRIORITY 1 - Do First (15 minutes):**
```
1. Add TeamManagement route to App.jsx
   File: src/App.jsx
   Action: 
   - Add: import { TeamManagement } from './pages/team/TeamManagement';
   - Add route: <Route path="/team" element={<TeamManagement />} />
   Time: 5 minutes

2. Delete TestApp.jsx
   File: src/TestApp.jsx
   Action: Delete file
   Time: 1 minute

3. Delete orphaned AppRoute.jsx
   File: src/components/AppRoute.jsx
   Action: Delete file
   Time: 1 minute

4. Delete 3 duplicate legal pages
   Files: 
   - src/pages/legal/PrivacyPolicy.jsx
   - src/pages/legal/TermsOfService.jsx
   - src/pages/legal/ConsentFlow.jsx
   Action: Delete all 3 files
   Time: 3 minutes

5. Test /team route works
   Time: 5 minutes
```

**PRIORITY 2 - After Priority 1 (15 minutes):**
```
1. Adopt useNotificationActions
   Location: src/hooks/useNotificationActions.js
   Add to: src/pages/Auth.jsx, src/pages/Settings.jsx, etc.
   Action: 
   - Import: import { useNotificationActions } from '../hooks/useNotificationActions';
   - Use: const { success, error } = useNotificationActions();
   Time: 10 minutes

2. Test notifications work
   Time: 5 minutes
```

**PRIORITY 3 - Quality Improvements (30+ minutes):**
```
1. Adopt Logger utility
   Location: src/utils/logger.ts
   Update: src/services/*, src/contexts/*, src/App.jsx
   Action: Replace console.log -> logger.info, etc.
   Time: 20 minutes

2. Integrate Offline Support
   Location: src/components/offline/OfflineSupport.jsx
   Add to: App.jsx header/footer
   Action: Import & render <OfflineIndicator />
   Time: 10 minutes

3. Test everything still works
   Time: 10 minutes
```

---

## 🔍 VERIFICATION COMMANDS

**Check what's imported from orphaned locations:**

```bash
# Check if TestApp is used
grep -r "TestApp" src/

# Check if AppRoute is used
grep -r "AppRoute" src/

# Check legal/* pages are used  
grep -r "legal/PrivacyPolicy" src/
grep -r "legal/TermsOfService" src/
grep -r "legal/ConsentFlow" src/

# Check if hooks are used
grep -r "useNotificationActions" src/

# Check if logger is used
grep -r "logger\." src/

# All should return 0 matches (except in their own files) before deletion
```

---

## 📋 FILES TO DELETE CHECKLIST

Before deleting, verify each file is not imported:

```
FILE TO DELETE: src/TestApp.jsx
├─ Check: grep -r "TestApp" src/ → Should be 0 matches
└─ OK to delete? ☐ YES ☐ NO

FILE TO DELETE: src/components/AppRoute.jsx
├─ Check: grep -r "AppRoute" src/ → Should be 0 matches
└─ OK to delete? ☐ YES ☐ NO

FILE TO DELETE: src/pages/legal/PrivacyPolicy.jsx
├─ Check: grep -r "legal/PrivacyPolicy" src/ → Should be 0 matches
└─ OK to delete? ☐ YES ☐ NO

FILE TO DELETE: src/pages/legal/TermsOfService.jsx
├─ Check: grep -r "legal/TermsOfService" src/ → Should be 0 matches
└─ OK to delete? ☐ YES ☐ NO

FILE TO DELETE: src/pages/legal/ConsentFlow.jsx
├─ Check: grep -r "legal/ConsentFlow" src/ → Should be 0 matches
└─ OK to delete? ☐ YES ☐ NO
```

---

## 🎯 SUCCESS CRITERIA

After completing all adoption steps:

```
ORPHANED CODE FULLY HANDLED:

Directory: src/
├─ TestApp.jsx ☐ DELETED
├─ components/AppRoute.jsx ☐ DELETED
├─ pages/legal/PrivacyPolicy.jsx ☐ DELETED
├─ pages/legal/TermsOfService.jsx ☐ DELETED
├─ pages/legal/ConsentFlow.jsx ☐ DELETED
├─ hooks/useNotificationActions.js ☐ ADOPTED
│  └─ Now imported in: ☐ Auth ☐ Settings ☐ Other pages
├─ utils/logger.ts ☐ ADOPTED
│  └─ Now used in: ☐ Services ☐ Contexts ☐ Components
├─ components/offline/OfflineSupport.jsx ☐ ADOPTED
│  └─ OfflineIndicator rendering in: ☐ App.jsx
└─ pages/team/TeamManagement.jsx ☐ ADOPTED
   └─ Route available at: ☐ /team

TESTING:
☐ http://localhost:8000/team → Shows team management
☐ Notifications show with rich styling
☐ Logger messages visible in console with [INFO] tags
☐ Offline indicator appears when network offline
☐ No console warnings
☐ App runs without errors
```

---

## 📊 SUMMARY STATS

```
BEFORE CLEANUP:
├─ Orphaned Files: 8
├─ Unused Lines: 650+
├─ Duplicate Pages: 4
└─ Missing Features: 1 routable

AFTER CLEANUP:
├─ Orphaned Files: 2 (optional layouts only)
├─ Unused Lines: 0
├─ Duplicate Pages: 0
├─ Ready Features: 4 integrated
└─ New Routes: 1 (/team)
```

---

## 💡 PRO TIPS

1. **Backup Before Deleting**: Make git commit before any deletions
   ```bash
   git add -A
   git commit -m "Before: Orphaned code cleanup"
   ```

2. **Delete One At A Time**: Delete files one-by-one and test after each
   ```bash
   rm src/TestApp.jsx
   # test app still works
   rm src/components/AppRoute.jsx
   # test app still works
   # etc.
   ```

3. **Use Git to Verify**: Check git status to see exactly what changed
   ```bash
   git status  # Shows deleted files
   git diff    # Shows specific deletions
   ```

4. **Quick Import Check**: Before deleting, always search first
   ```bash
   grep -r "filename" src/  # Should return 0 if really orphaned
   ```

---

**Reference Generated**: February 2026  
**Status**: Ready to execute  
**Files Can Be Opened**: Any text editor or VS Code  
**Estimated Time to Complete**: 60 minutes
