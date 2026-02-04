# Phase 3 Quick Start Testing Guide

**Time to Complete**: 30-45 minutes  
**Status**: ✅ Ready to test  
**Prerequisites**: Node.js 16+, npm, running backend  

---

## 1. Start the Development Server

```bash
cd c:\Users\borah\care-droid-app-main
npm run dev
```

**Expected Output**:
```
  VITE v7.3.1  ready in 000 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

**Open Browser**: http://localhost:5173/

---

## 2. Test Phase 3 Features (15-20 min)

### ✅ TEST 1: Dashboard Loads
**Action**: 
1. Open app at http://localhost:5173/
2. You should see Dashboard with chat interface

**Expected**: 
- ✅ Dashboard loads without errors
- ✅ Chat input visible
- ✅ No red error boxes
- ✅ Browser console clean (F12 → Console tab)

**Troubleshoot**: 
- If 404: Check backend running on port 3000
- If error: Check browser console for import errors

---

### ✅ TEST 2: Tool Recommendations
**Action**:
1. In Dashboard, type this message: `"Check drug interaction between metformin and aspirin"`
2. Look for suggestion pills appearing below input
3. Expected: "drug-checker" pill appears

**Alternative Tests**:
- Type: `"abnormal lab values"` → Expected: "lab-interpreter" pill
- Type: `"calculate GFR"` → Expected: "calculator" pill
- Type: `"trauma protocol"` → Expected: "protocol-lookup" pill

**Expected**:
- ✅ Suggestion pills appear with tool name
- ✅ Each pill shows confidence % (0.95, 0.90, etc.)
- ✅ Clicking pill selects tool
- ✅ No JavaScript errors in console

**Troubleshoot**:
- If no pills: Check `src/utils/toolRecommendations.js` exists
- If errors: Check Dashboard.jsx imports

---

### ✅ TEST 3: Analytics Dashboard Page
**Action**:
1. Click hamburger menu or navigate to `/analytics`
2. URL should change to: http://localhost:5173/analytics
3. You should see dashboard with charts

**Expected**:
- ✅ Page loads without 404 error
- ✅ "Clinical Analytics" header visible
- ✅ Summary cards show (Total Events, Active Clinicians, Top Events)
- ✅ Tool Usage section visible
- ✅ Engagement metrics section visible

**Data**:
- May show "0" or "…" if no events yet (that's OK)
- Once you send messages, metrics should update

**Troubleshoot**:
- If 404: Check App.jsx has route `/analytics`
- If data empty: Backend events not yet recorded (check POST endpoint)

---

### ✅ TEST 4: Workspaces
**Action**:
1. In Sidebar (left side), find workspace selector
2. Click dropdown to see workspace options
3. Select "ICU Tools"
4. Observe tool list updates

**Expected Workspaces**:
- All Tools (complete list)
- Favorites (user-pinned tools)
- Recent (last 5 used)
- ICU Tools (sofa, lab-interp, protocols)
- Emergency (trauma-score, drug-checker, etc.)
- Oncology (cancer-calc, etc.)

**Expected**:
- ✅ Dropdown appears with 6 workspace options
- ✅ Selecting "ICU Tools" shows only ICU tools
- ✅ Tool list updates without page refresh
- ✅ Selecting another workspace filters again

**Persistence Test**:
1. Switch to "ICU Tools"
2. Refresh page (F5)
3. Expected: Still on "ICU Tools" (workspace persisted)

**Troubleshoot**:
- If dropdown not visible: Check Sidebar.jsx has workspace selector
- If not switching: Check WorkspaceContext.jsx is in App.jsx provider stack

---

### ✅ TEST 5: Session Sharing
**Action**:
1. Navigate to any tool page (e.g., `/tools/drug-checker`)
2. Fill in some tool data (e.g., enter drug names)
3. Look for "Share" button (should be near top right)
4. Click Share button

**Expected**:
- ✅ Link copied to clipboard (toast notification or subtle feedback)
- ✅ Console shows copied link (check DevTools → Console)

**Test Share Link**:
1. Open new tab or private window
2. Paste the link: `http://localhost:5173/tools/share?session=ABC123`
3. You should see readonly view with "Shared tool session from..."

**Expected**:
- ✅ Readonly view loads without editing
- ✅ Tool data displayed (drug names, results, etc.)
- ✅ No input fields (readonly)
- ✅ "Copy Code" button visible

**Troubleshoot**:
- If Share button missing: Check ToolPageLayout.jsx has button
- If link 404: Check App.jsx has `/tools/share` route
- If data empty: Check sharedSessions.js localStorage logic

---

### ✅ TEST 6: Chat with Tool Visualizations
**Action**:
1. In Dashboard, send a message that triggers tool execution
2. E.g., type: `"Check if aspirin and metformin interact"`
3. Wait for backend response

**Expected**:
- ✅ Assistant responds with tool result
- ✅ If result includes visualizations, should render nicely
  - **drug-interaction**: Table with drug names + severity badges
  - **calculator**: Grid with results (e.g., GFR = 45.2)
  - **vitals**: Color-coded ranges
  - Otherwise: JSON not shown (should be formatted nicely)

**Expected Visualization Types**:
```
✅ Drug Interaction Table
┌────────────┬────────────┬──────────┐
│ Drug A     │ Drug B     │ Severity │
├────────────┼────────────┼──────────┤
│ Aspirin    │ Metformin  │ Moderate │
│ Aspirin    │ Ibuprofen  │ Mild     │
└────────────┴────────────┴──────────┘

✅ Calculator Results Grid
GFR: 45.2 mL/min
BMI: 24.5 kg/m²
Score: 7.8/10

✅ Vitals Grid
HR: 72 (normal) ✓
BP: 140/90 (elevated) ⚠
O2: 98 (normal) ✓

✅ Anomaly Detection List
Anomaly Score: 0.87 (HIGH) 🔴
```

**Troubleshoot**:
- If JSON shown: Check ChatInterface.jsx imports ToolVisualization
- If errors: Check ToolVisualization.jsx syntax
- If data empty: Backend not returning visualizations (check backend)

---

## 3. Browser Console Check (5 min)

Press **F12** to open DevTools → Go to **Console** tab

**Expected**: 
- ✅ No RED errors
- ✅ May have YELLOW warnings (acceptable)
- ✅ May see INFO logs (analytics, workspace loaded, etc.)

**Common Issues** (If you see these, check solutions):

```
❌ Uncaught TypeError: Cannot read property 'map' of undefined
→ Solution: Check imports in Dashboard.jsx or ToolsOverview.jsx

❌ Failed to fetch /api/analytics/events
→ Solution: Backend not running. Start backend server.

❌ SharedToolSession is not defined
→ Solution: Check App.jsx imports SharedToolSession

❌ WorkspaceContext is not defined
→ Solution: Check App.jsx has WorkspaceProvider wrapper
```

---

## 4. Network Tab Check (5 min)

Press **F12** → Go to **Network** tab

**Send a message in Dashboard**

**Look for**:
- ✅ POST to `/api/chat/...` (message sent)
- ✅ POST to `/api/analytics/events` (analytics tracked)
- ✅ Status 200 or 201 for all requests

**If missing**:
- Analytics endpoint: May not fire immediately (batched every 30s)
- Check: Open console and type `document.body.innerHTML.match(/analytics/i)` to verify analyticsService imported

---

## 5. LocalStorage Check (5 min)

Press **F12** → Go to **Application** tab → **LocalStorage** → Select `http://localhost:5173`

**Expected Keys**:
- ✅ `careDroid.workspaces` (workspace definitions)
- ✅ `careDroid.activeWorkspace` (current workspace ID)
- ✅ `careDroid.sharedSessions.v1` (shared session codes)
- ✅ Other `careDroid.*` keys from Phase 1 & 2

**View Workspace Data**:
```javascript
// In Console tab, paste:
console.log(JSON.parse(localStorage.getItem('careDroid.workspaces')))

// Expected output:
[
  { id: 'all-tools', name: 'All Tools', tools: [...], color: '#4F46E5', isActive: true },
  { id: 'icu-tools', name: 'ICU Tools', tools: [...], color: '#FF6B6B', isActive: false },
  ...
]
```

**Test Persistence**:
1. Click workspace selector, choose "Emergency"
2. Refresh page (F5)
3. Open DevTools → LocalStorage
4. Check `careDroid.activeWorkspace` = "emergency"
5. Expected: Still on Emergency tools after refresh ✅

---

## 6. Full Feature Verification Checklist

Print this and check off as you test:

```
Phase 3 Testing Checklist
═════════════════════════════════════════════════

□ BUILD VERIFICATION
  □ npm run build completes successfully
  □ dist/ folder created with index.html, CSS, JS

□ DASHBOARD
  □ App loads at http://localhost:5173
  □ Chat interface visible
  □ Browser console clean (no red errors)

□ RECOMMENDATIONS
  □ Type "drug interaction" → drug-checker pill appears
  □ Type "lab values" → lab-interpreter pill appears
  □ Type "calculate GFR" → calculator pill appears
  □ Clicking pill selects tool (highlights in sidebar)
  □ Multiple keywords handled correctly

□ ANALYTICS DASHBOARD
  □ Navigate to /analytics (no 404)
  □ Page loads with charts
  □ Summary cards visible
  □ Tool usage section renders
  □ Engagement metrics visible

□ WORKSPACES
  □ Sidebar has workspace selector
  □ Can select different workspaces
  □ Tool list updates on workspace change
  □ "ICU Tools" shows only ICU tools
  □ "Emergency" shows only emergency tools
  □ Workspace persists after page refresh

□ SESSION SHARING
  □ Tool page has Share button
  □ Clicking Share copies link
  □ Link format: /tools/share?session=CODE
  □ Opening link in new tab shows readonly view
  □ Shared-by metadata displayed
  □ Copy button works in shared view

□ VISUALIZATIONS
  □ Tool results render as tables/grids (not JSON)
  □ Drug interaction shows severity badges
  □ Calculator shows formatted results
  □ Vitals show color-coded ranges
  □ No raw JSON exposed to user

□ INTEGRATION
  □ Phase 1 features work (tool nav, chat, etc.)
  □ Phase 2 features work (favorites, pinning, etc.)
  □ No breaking changes
  □ All new routes accessible

□ DATA PERSISTENCE
  □ Workspaces persist in localStorage
  □ Active workspace remembered after refresh
  □ Shared sessions stored in localStorage
  □ Analytics events logged (check Network tab)

═════════════════════════════════════════════════

OVERALL RESULT: [ ] PASS  [ ] FAIL  [ ] PARTIAL

Issues Found:
_____________________________________________
_____________________________________________
_____________________________________________
```

---

## 7. Performance Baseline

**Record these numbers for future optimization**:

Open **F12** → **Network** tab → **Disable cache** → Reload page

| Metric | Expected | Actual | Status |
|--------|----------|--------|--------|
| Page load time | <2s | ___ ms | ✅ |
| Bundle size | 570 kB | ___ kB | ✅ |
| Gzipped | <200 kB | ___ kB | ✅ |
| Total requests | <20 | ___ | ✅ |
| Largest asset | <300 kB | ___ kB | ✅ |

---

## 8. Common Issues & Quick Fixes

### Issue: "Cannot find module 'toolRecommendations'"
**Fix**: Check file exists at `src/utils/toolRecommendations.js`
```bash
ls src/utils/toolRecommendations.js
```

### Issue: Workspaces dropdown not showing
**Fix**: Verify Sidebar.jsx has workspace selector code
```bash
grep -n "workspace" src/components/Sidebar.jsx
```

### Issue: Share button missing from tool page
**Fix**: Check ToolPageLayout.jsx has share button (look for "Share" text)
```bash
grep -n "Share" src/pages/tools/ToolPageLayout.jsx
```

### Issue: Analytics page 404
**Fix**: Verify route in App.jsx
```bash
grep -n "analytics" src/App.jsx
```

### Issue: No analytics events in Network tab
**Fix**: This is normal - events are batched every 30s or 50 events. Type multiple messages or wait 30s.

### Issue: Visualization shows JSON instead of table
**Fix**: Clear browser cache and reload
```javascript
// In Console:
localStorage.clear()
location.reload()
```

---

## 9. Success Criteria

Phase 3 is **SUCCESSFUL** when:

✅ **All 6 tests pass** (Dashboard, Recommendations, Analytics, Workspaces, Sharing, Visualizations)  
✅ **No red errors in console** (warnings OK)  
✅ **Workspace selector works** (can switch contexts)  
✅ **Recommendations show** (5+ different keyword categories tested)  
✅ **Share links work** (can generate and load in incognito)  
✅ **Visualizations render** (not JSON output)  
✅ **Phase 1 & 2 still work** (no regressions)  
✅ **localStorage persists data** (workspaces survive refresh)  

---

## 10. Next Steps (After Passing Tests)

If all tests pass:

1. **Test with Backend**: Verify analytics events actually persist to database
   - Check backend logs for POST /api/analytics/events
   - Query database: `SELECT * FROM analytics_events LIMIT 5`
   - Verify /api/analytics/metrics returns real data

2. **Configure Test Framework**: Set up Vitest/Jest for automated testing
   ```bash
   npm install -D vitest @testing-library/react
   npm run test
   ```

3. **Performance Tuning** (Optional):
   - Reduce bundle size with code splitting
   - Optimize images/assets
   - Cache strategies

4. **Deploy to Staging**:
   ```bash
   npm run build
   # Deploy dist/ folder to staging environment
   ```

5. **Gather User Feedback**: Share with clinical team for beta testing

---

## 📞 Support

**If you get stuck**:
1. Check browser console (F12 → Console) for error messages
2. Check Network tab (F12 → Network) for failed requests
3. Verify backend is running: `curl http://localhost:3000/api/health`
4. Check localStorage (F12 → Application → LocalStorage)
5. Read [PHASE_3_IMPLEMENTATION_COMPLETE.md](PHASE_3_IMPLEMENTATION_COMPLETE.md) for detailed docs

---

## Quick Command Reference

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# View build output size
ls -lh dist/assets/

# Check for TypeScript errors (if using TS)
npm run type-check

# Run tests (after setup)
npm run test

# Clear cache and retest
rm -rf node_modules/.vite
npm run dev -- --force
```

---

**Estimated Time**: 30-45 minutes  
**Difficulty**: Easy (mostly clicking + observing)  
**Requirements**: Node.js, npm, browser, backend running  

**Ready to test?** 🚀

Open your terminal and run:
```bash
npm run dev
```

Then navigate browser to: http://localhost:5173/

Good luck! 🎉

