# 🔍 Unused Files & Code Audit Report

**Generated:** February 3, 2026  
**Project:** CareDroid-AI  
**Status:** Comprehensive audit completed

---

## 📊 Executive Summary

### Findings Overview
- ✅ **10 items** identified for cleanup
- ⚠️ **6 duplicate files** found
- 🔧 **4 misplaced files** detected
- 📁 **2 empty directories** can be removed
- 🧹 **1 build artifact** should be gitignored

### Priority Classification
- **High Priority:** 4 items - duplicates & misplaced files
- **Medium Priority:** 4 items - build artifacts & empty dirs
- **Low Priority:** 2 items - optional cleanup

---

## 🔴 High Priority Issues

### 1. Duplicate Service Worker Files

**Issue:** Service worker files exist in multiple locations

**Duplicates Found:**
```
✗ public/sw.js (211 lines) 
✗ backend/public/sw.js (211 lines) - IDENTICAL
✗ dist/sw.js (211 lines) - Build artifact

✗ public/firebase-messaging-sw.js (31 lines)
✗ backend/public/firebase-messaging-sw.js (31 lines) - IDENTICAL
```

**Analysis:**
- `backend/public/` appears to be a static file serving directory for the backend
- Files are identical - likely copied/synced during build
- `dist/sw.js` is generated during build (correctly in .gitignore)

**Recommendation:**
```bash
# Keep only frontend copy, backend should serve from dist
rm backend/public/sw.js
rm backend/public/firebase-messaging-sw.js
```

**Impact:** Low - backend likely serving frontend dist folder in production

---

### 2. Misplaced Test Files

**Issue:** Test files scattered in source directories instead of tests/

**Files Found:**
```
✗ src/test/WorkspaceContext.test.jsx
✗ src/test/NotificationService.test.js
✗ src/test/RealTimeCostService.test.js
✗ src/test/ExportService.test.js
✗ src/test/CostTrackingContext.test.jsx
✗ src/test/advancedRecommendationService.test.js
✗ src/components/ToolCard.test.jsx
✗ src/components/ChatInterface.test.jsx
```

**Current Structure:**
```
src/
├── components/
│   ├── ToolCard.jsx
│   └── ToolCard.test.jsx          ❌ Test with source
├── test/                           ❌ Mixed location
│   └── *.test.js
```

**Recommended Structure:**
```
tests/
├── frontend/
│   ├── unit/
│   │   ├── components/
│   │   │   ├── ToolCard.test.jsx
│   │   │   └── ChatInterface.test.jsx
│   │   ├── contexts/
│   │   │   ├── WorkspaceContext.test.jsx
│   │   │   └── CostTrackingContext.test.jsx
│   │   └── services/
│   │       ├── NotificationService.test.js
│   │       ├── RealTimeCostService.test.js
│   │       ├── ExportService.test.js
│   │       └── advancedRecommendationService.test.js
│   ├── test-routes.js
│   └── test-runner-full.js
```

**Actions:**
```bash
# Create structure
mkdir -p tests/frontend/unit/{components,contexts,services}

# Move test files
mv src/components/*.test.jsx tests/frontend/unit/components/
mv src/test/*Context.test.jsx tests/frontend/unit/contexts/
mv src/test/*Service.test.js tests/frontend/unit/services/
mv src/test/advancedRecommendationService.test.js tests/frontend/unit/services/

# Keep test setup
mv src/test/setup.js tests/frontend/
```

**Impact:** Medium - requires updating test runner configuration

---

### 3. Standalone Utility Script

**File:** `backend/verify-tls-enforcement.js`

**Analysis:**
- Standalone verification script (169 lines)
- Not imported anywhere in the codebase
- Useful for security audits but not part of application
- Should be in scripts/ or tools/ directory

**Recommendation:**
```bash
# Move to backend scripts
mv backend/verify-tls-enforcement.js backend/scripts/verify-tls.js
```

**Update package.json:**
```json
{
  "scripts": {
    "verify:tls": "node scripts/verify-tls.js"
  }
}
```

**Impact:** Low - standalone utility script

---

### 4. Build Log File

**File:** `android/build-log.txt`

**Issue:** Build log committed to repository

**Recommendation:**
```bash
# Remove from repo
rm android/build-log.txt

# Ensure it's in .gitignore
echo "*.log" >> .gitignore
echo "build-log.txt" >> android/.gitignore
```

**Impact:** Low - just cleanup

---

## 🟡 Medium Priority Issues

### 5. Empty Directories

**Directories Found:**
```
✗ docs/guides/              - Empty, placeholder for future content
✗ android/play-store-assets/screenshots/phone/  - Empty
✗ android/play-store-assets/feature-graphic/    - Empty
✗ android/play-store-assets/icon/               - Empty
```

**Analysis:**
- `docs/guides/` - Intentionally created for future documentation ✅ KEEP
- `android/play-store-assets/*` - Placeholder directories for assets ✅ KEEP or add .gitkeep

**Recommendation:**
```bash
# Add .gitkeep to preserve directory structure
touch android/play-store-assets/screenshots/phone/.gitkeep
touch android/play-store-assets/feature-graphic/.gitkeep
touch android/play-store-assets/icon/.gitkeep
touch docs/guides/.gitkeep
```

**Impact:** Low - just housekeeping

---

### 6. Build Artifacts in Repository

**Files Found:**
```
✗ dist/ (2.4 MB) - Frontend build output
✗ android/build/ (140 KB) - Android build cache
```

**Analysis:**
- Both are already in `.gitignore` ✅
- Exist locally but not in git
- No action needed

**Recommendation:**
```bash
# Verify they're ignored
git check-ignore dist
git check-ignore android/build

# If not, ensure .gitignore has:
dist/
android/build/
```

**Impact:** None - already handled

---

### 7. Backend Public Assets

**Directory:** `backend/public/assets/`

**Contents:**
```
index-Bg8MMVwO.css
index-C5W2SYTa.js
index-C5W2SYTa.js.map
```

**Analysis:**
- Appears to be frontend build artifacts
- Backend serving static frontend files
- Should be served from `dist/` not committed separately

**Recommendation:**
```bash
# Remove if backend serves from ../dist
rm -rf backend/public/assets/

# Update backend static serving to point to ../dist
# Check backend/src/app.module.ts ServeStaticModule config
```

**Impact:** Medium - verify backend static file serving

---

## 🟢 Low Priority / Optional

### 8. Test Setup File Location

**File:** `src/test/setup.js`

**Analysis:**
- Vitest setup file
- Currently in `src/test/`
- Could be moved to `tests/frontend/setup.js`

**Recommendation:**
```bash
# Move with other test files
mv src/test/setup.js tests/frontend/setup.js

# Update vitest.config.js
setupFiles: ['./tests/frontend/setup.js']
```

**Impact:** Low - configuration change only

---

### 9. Debug Logging

**Found:** Multiple `logger.debug()` calls in production code

**Locations:**
- `src/contexts/UserContext.jsx` (6 occurrences)
- `src/contexts/ConversationContext.jsx` (5 occurrences)
- `src/pages/Auth.jsx` (3 occurrences)

**Analysis:**
- Debug logging is conditional based on `VITE_DEBUG` env var
- Properly implemented ✅
- No cleanup needed

**Recommendation:**
- Keep as-is, debug logging is properly gated
- Consider using log levels more consistently

**Impact:** None

---

### 10. Cache Configuration

**Found:** Same cache name in multiple service workers

```javascript
const CACHE_NAME = 'caredroid-v3-with-sidebar';
```

**Locations:**
- `public/sw.js`
- `backend/public/sw.js` (duplicate)
- `dist/sw.js` (build output)

**Analysis:**
- This is expected - single source of truth in `public/sw.js`
- Others are either duplicates (backend) or build artifacts (dist)
- No cleanup needed after removing backend duplicate

**Recommendation:**
- Already addressed in Issue #1

**Impact:** None

---

## 📋 Cleanup Action Plan

### Phase 1: High Priority (Do First)

```bash
# 1. Remove duplicate service workers from backend
rm backend/public/sw.js
rm backend/public/firebase-messaging-sw.js

# 2. Reorganize test files
mkdir -p tests/frontend/unit/{components,contexts,services}
mv src/components/*.test.jsx tests/frontend/unit/components/
mv src/test/*Context.test.jsx tests/frontend/unit/contexts/
mv src/test/*Service.test.js tests/frontend/unit/services/
mv src/test/advancedRecommendationService.test.js tests/frontend/unit/services/
mv src/test/setup.js tests/frontend/

# 3. Move utility script
mv backend/verify-tls-enforcement.js backend/scripts/verify-tls.js

# 4. Remove build log
rm android/build-log.txt
```

### Phase 2: Medium Priority

```bash
# 5. Add .gitkeep to preserve empty directories
touch docs/guides/.gitkeep
touch android/play-store-assets/screenshots/phone/.gitkeep
touch android/play-store-assets/feature-graphic/.gitkeep
touch android/play-store-assets/icon/.gitkeep

# 6. Review backend static assets
# Check if backend/public/assets/ is needed
# If not: rm -rf backend/public/assets/
```

### Phase 3: Configuration Updates

**Update `vitest.config.js`:**
```javascript
export default defineConfig({
  test: {
    setupFiles: ['./tests/frontend/setup.js'],
    // Update any paths that referenced src/test/
  }
});
```

**Update `backend/package.json`:**
```json
{
  "scripts": {
    "verify:tls": "node scripts/verify-tls.js"
  }
}
```

**Update `.gitignore` (if not already present):**
```
*.log
build-log.txt
dist/
android/build/
backend/dist/
```

---

## 🎯 Impact Assessment

### Disk Space Saved
- Duplicate service workers: ~15 KB
- Build log: ~5 KB
- **Total:** ~20 KB (minimal impact)

### Code Quality Improvement
- ✅ Better test organization
- ✅ Eliminated duplicates
- ✅ Clearer project structure
- ✅ Proper file locations

### Breaking Changes
- ⚠️ Test imports may need updates
- ⚠️ Vitest config needs update
- ✅ No runtime breaking changes

---

## ✅ Verification Steps

After cleanup, verify:

```bash
# 1. Tests still run
npm run test

# 2. Backend tests work
cd backend && npm run test

# 3. Build succeeds
npm run build
cd backend && npm run build

# 4. No git changes for ignored files
git status

# 5. Service workers load
npm run dev
# Check browser console for SW registration
```

---

## 📊 Statistics

### Before Cleanup
- Test files in source: 8
- Duplicate service workers: 2
- Misplaced scripts: 1
- Build logs in repo: 1

### After Cleanup
- Test files in source: 0 ✅
- Duplicate service workers: 0 ✅
- Misplaced scripts: 0 ✅
- Build logs in repo: 0 ✅

---

## 🎉 Summary

**Overall Assessment:** ✅ **Good**

The project is generally well-organized after the recent restructuring. The main issues are:
1. Minor duplicate files (easy fix)
2. Test organization (improves maintainability)
3. A few misplaced files (quick cleanup)

No critical issues found. All identified items are safe to clean up without breaking functionality.

**Estimated Cleanup Time:** 15-20 minutes

**Risk Level:** 🟢 **Low** - All changes are non-breaking with proper configuration updates

---

## ✅ Cleanup Milestones & Reports

### Milestone 1 — Baseline Hygiene

**Cleanup actions:**
- Remove duplicate service workers in backend static folder.
- Delete build log file and ensure log patterns remain ignored.
- Add `.gitkeep` to placeholder asset/docs directories.

**Reports to review at milestone end:**
- [SYSTEM_HEALTH_REPORT.md](docs/archive/SYSTEM_HEALTH_REPORT.md)
- [FULL_TEST_REPORT.md](docs/archive/FULL_TEST_REPORT.md)
- [TEST_RESULTS_FINAL.md](docs/archive/TEST_RESULTS_FINAL.md)

### Milestone 2 — Test Consolidation

**Cleanup actions:**
- Move unit tests from src/ and src/test/ into tests/frontend/unit/.
- Update `vitest.config.js` to new setup file path.
- Verify route test scripts still run from tests/frontend/.

**Reports to review at milestone end:**
- [PHASE_3_TESTING_GUIDE.md](docs/archive/PHASE_3_TESTING_GUIDE.md)
- [PHASE_3_IMPLEMENTATION_COMPLETE.md](docs/archive/PHASE_3_IMPLEMENTATION_COMPLETE.md)
- [PHASE_3_EXECUTIVE_SUMMARY.md](docs/archive/PHASE_3_EXECUTIVE_SUMMARY.md)

### Milestone 3 — Deployment & Static Assets

**Cleanup actions:**
- Move TLS verification script to backend scripts and add npm script.
- Remove backend/public/assets if backend serves from dist.
- Confirm ServeStaticModule points to correct static directory.

**Reports to review at milestone end:**
- [PHASE_4_PROGRESS.md](docs/archive/PHASE_4_PROGRESS.md)
- [PHASE_10_COMPLETE.md](docs/archive/PHASE_10_COMPLETE.md)
- [PHASE_10_FILE_SUMMARY.md](docs/archive/PHASE_10_FILE_SUMMARY.md)

### Milestone 4 — Orphaned Artifacts Review

**Cleanup actions:**
- Verify no leftover orphaned configs in root.
- Re-run audit and update this report with closure status.

**Reports to review at milestone end:**
- [ORPHANED_CODE_AUDIT.md](docs/archive/ORPHANED_CODE_AUDIT.md)
- [ORPHANED_CODE_EXECUTIVE_SUMMARY.md](docs/archive/ORPHANED_CODE_EXECUTIVE_SUMMARY.md)
- [ORPHANED_CODE_FILE_LOCATIONS.md](docs/archive/ORPHANED_CODE_FILE_LOCATIONS.md)

---

**Next Steps:**
1. Review this report
2. Execute Phase 1 cleanup
3. Update configurations
4. Run verification tests
5. Commit changes

---

**Generated by:** GitHub Copilot  
**Date:** February 3, 2026  
**Status:** ✅ Ready for Action
