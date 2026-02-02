# Deprecated Files After Android Migration

## Overview
After migrating from a Capacitor hybrid app to native Android, the following files are no longer needed and can be safely removed.

---

## Files to Remove

### 1. Capacitor Configuration ❌
**Files:**
- `capacitor.config.json` - Capacitor configuration file
- `capacitor.config.ts` - TypeScript Capacitor config (if exists)

**Reason:** No longer using Capacitor bridge. Native Android app is standalone.

**Status:** Can be removed immediately.

---

### 2. iOS Platform (Optional) ❌
**Directory:**
- `ios/` - Entire iOS platform directory

**Reason:** If you're only supporting Android, iOS build files are unnecessary.

**Status:** Remove if not planning iOS support.

**Keep if:** Planning to migrate iOS separately later.

---

### 3. Web Build Outputs ❌
**Directories:**
- `dist/` - Vite build output directory
- `build/` - Alternative build output

**Reason:** Generated files from Vite builds. Not needed for native Android.

**Status:** Can be removed. Will regenerate if web version needed later.

---

### 4. Vite Configuration ⚠️
**Files:**
- `vite.config.js` - Vite bundler configuration
- `vite.config.ts` - TypeScript version (if exists)
- `index.html` - Vite entry point HTML

**Reason:** Used for web app bundling. Native Android doesn't use Vite.

**Status:** Remove ONLY if no longer maintaining web version.

**Keep if:** Want to keep web version alongside Android app.

---

### 5. Web Source Files ⚠️
**Directory:**
- `src/` - Contains React/web source code
  - `src/components/` - Web React components
  - `src/pages/` - Web pages
  - `src/services/` - Web services
  - `src/contexts/` - React contexts
  - `src/hooks/` - React hooks
  - `src/utils/` - Utility functions

**Reason:** All functionality migrated to Android Kotlin code in `android/app/src/`.

**Status:** Remove ONLY if completely migrated and no web version needed.

**Keep if:**
- Want to maintain web version
- Need reference for remaining features
- Plan to support progressive web app (PWA)

**Migration Status:**
- ✅ All core features migrated to Android
- ✅ Authentication → `android/app/src/.../ui/viewmodel/AuthViewModel.kt`
- ✅ Chat → `android/app/src/.../ui/viewmodel/ChatViewModel.kt`
- ✅ Components → Jetpack Compose in `android/app/src/.../ui/components/`
- ✅ Services → Kotlin services in `android/app/src/.../data/`

---

### 6. Public Web Assets ⚠️
**Directory:**
- `public/` - Static web assets
  - `public/firebase-messaging-sw.js` - Firebase service worker
  - `public/sw.js` - General service worker
  - `public/assets/` - Images, icons, etc.

**Reason:** Service workers and web-specific assets not used in Android.

**Status:** Remove if not maintaining web version.

**Keep if:** Maintaining web version or PWA.

**Note:** Android uses native Firebase messaging, not service workers.

---

### 7. Build Scripts ❌
**Files:**
- `build-android.ps1` - Old PowerShell build script for Capacitor
- `scripts/generate-icons.js` - Icon generation for web/Capacitor

**Reason:** Replaced by native Gradle build system (`android/build-release.sh`).

**Status:** Can be removed immediately.

---

### 8. Node.js Frontend Dependencies ⚠️
**Files/Directories:**
- `node_modules/` - Frontend dependencies
- `package.json` - Frontend package configuration
- `package-lock.json` - Dependency lock file

**Reason:** Used for web app development. Android uses Gradle dependencies.

**Status:** Remove frontend package files ONLY if:
- No longer maintaining web version
- Backend has its own package.json in `backend/`
- No shared scripts needed

**Keep if:**
- Want to run web version
- Need for build scripts
- Backend shares the same package.json

**Note:** Backend in `backend/` has its own separate `package.json` - keep that one!

---

### 9. Linting Configuration ⚠️
**Files:**
- `.eslintrc.cjs` - ESLint configuration for JavaScript
- `.eslintrc.json` - Alternative ESLint config
- `.prettierrc` - Prettier code formatter config

**Reason:** Used for JavaScript/TypeScript linting. Android uses Kotlin with its own linting.

**Status:** Remove if no longer maintaining web code.

**Keep if:**
- Maintaining web version
- Backend TypeScript code needs linting
- Want consistent code formatting

---

### 10. Test Files ❌
**Files:**
- `AUTH_DEBUG_TEST.html` - HTML test file for auth debugging

**Reason:** Debug file for web authentication. Not needed for Android.

**Status:** Can be removed immediately.

---

## Files to KEEP ✅

### Android Native App
- `android/` - **ENTIRE DIRECTORY - KEEP THIS!**
  - Contains the native Android application
  - All Kotlin code
  - Gradle build system
  - Resources and assets

### Backend Server
- `backend/` - **KEEP**
  - NestJS backend API server
  - TypeScript source code
  - Backend tests
  - ML services
  - Docker configuration

### Infrastructure
- `config/` - **KEEP**
  - Prometheus configuration
  - Grafana dashboards
  - Logstash configuration
  - Alertmanager config

### CI/CD
- `.github/` - **KEEP**
  - GitHub Actions workflows
  - Issue templates
  - Pull request templates

### Documentation
- `*.md` files - **KEEP ALL**
  - `README.md`
  - `ANDROID_MIGRATION_PLAN.md`
  - `MIGRATION_CHECKLIST.md`
  - `MIGRATION_SUCCESS.md`
  - `PHASE_*_COMPLETE.md`
  - `DEPLOYMENT_GUIDE.md`

### Configuration Files
- `docker-compose.yml` - **KEEP** (for backend services)
- `.env.example` - **KEEP** (environment template)
- `.gitignore` - **KEEP** (Git ignore rules)
- `app-store-metadata.yml` - **KEEP** (app store info)

---

## Cleanup Strategy

### Option 1: Conservative (Recommended)
Keep everything initially, remove only after confirming Android app works perfectly.

```bash
# Remove only confirmed unnecessary files
rm capacitor.config.json
rm build-android.ps1
rm AUTH_DEBUG_TEST.html
rm -rf dist/
```

### Option 2: Moderate
Remove Capacitor and build artifacts, keep source for reference.

```bash
# Use the cleanup script interactively
./cleanup-hybrid-files.sh
# Answer "no" to removing src/, public/, vite configs
```

### Option 3: Aggressive
Remove all web-related files (only if 100% sure Android-only).

```bash
# Use the cleanup script and remove everything
./cleanup-hybrid-files.sh
# Answer "yes" to all prompts
```

---

## Cleanup Script

A cleanup script has been provided: `cleanup-hybrid-files.sh`

**Usage:**
```bash
chmod +x cleanup-hybrid-files.sh
./cleanup-hybrid-files.sh
```

**Features:**
- Interactive prompts for each category
- Safety confirmations
- Tracks what's removed
- Shows summary at end
- Recommends next steps

---

## Pre-Cleanup Checklist

Before running cleanup:

- [ ] Android app builds successfully
  ```bash
  cd android && ./gradlew assembleDebug
  ```

- [ ] All features work in Android app
  - [ ] Login/authentication
  - [ ] Chat interface
  - [ ] Drug checker
  - [ ] Lab interpreter
  - [ ] SOFA calculator
  - [ ] Offline mode
  - [ ] Push notifications
  - [ ] Biometric auth

- [ ] Tests pass
  ```bash
  cd android && ./gradlew test
  ```

- [ ] Backend still works independently
  ```bash
  cd backend && npm install && npm run start:dev
  ```

- [ ] Code is committed to Git
  ```bash
  git add -A
  git commit -m "Complete Android migration - pre-cleanup checkpoint"
  ```

- [ ] Backup exists (just in case)
  ```bash
  git tag backup-pre-cleanup
  ```

---

## After Cleanup

### Verify Android Build
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### Test Release Build
```bash
adb install app/build/outputs/apk/release/app-release.apk
```

### Update .gitignore
Ensure `.gitignore` doesn't reference removed directories:
```bash
# Remove these lines if they exist:
# - References to dist/
# - References to build/
# - References to node_modules/ (if removed)
```

### Commit Cleanup
```bash
git add -A
git commit -m "Clean up hybrid app files after Android migration

- Removed Capacitor configuration
- Removed web build outputs
- Removed old build scripts
- Kept backend and Android native app
- Kept all documentation"
```

---

## Rollback Plan

If you need to restore deleted files:

### If you committed before cleanup:
```bash
git checkout backup-pre-cleanup -- <file-or-directory>
```

### If you tagged:
```bash
git checkout backup-pre-cleanup
```

### If you pushed:
```bash
git revert HEAD
```

---

## Space Saved

Typical space savings after cleanup:

| Item | Approximate Size |
|------|------------------|
| node_modules/ | 200-500 MB |
| dist/ | 10-50 MB |
| ios/ | 50-100 MB |
| src/ | 1-5 MB |
| **Total** | **~250-650 MB** |

---

## Decision Matrix

| File/Directory | Remove if... | Keep if... |
|----------------|-------------|-----------|
| `capacitor.config.json` | Always (Android-only) | Never |
| `ios/` | Android-only app | Planning iOS migration |
| `dist/`, `build/` | Always (regenerable) | Never |
| `vite.config.js` | Android-only | Maintaining web version |
| `src/` | Fully migrated | Want web version |
| `public/` | Android-only | Maintaining web/PWA |
| `node_modules/` | Android-only + backend separate | Shared dependencies |
| `package.json` | Backend separate | Needed for scripts |
| Build scripts | Always (replaced by Gradle) | Never |

---

## Summary

✅ **Safe to remove immediately:**
- Capacitor config
- Build outputs (dist/, build/)
- Old build scripts
- Test HTML files

⚠️ **Remove with caution:**
- iOS directory (if not needed)
- src/ and public/ (if web version not needed)
- Vite config (if web version not needed)
- Frontend node_modules (if backend separate)

✅ **Always keep:**
- `android/` directory
- `backend/` directory
- Documentation (*.md files)
- Infrastructure configs
- .github/ workflows

---

**Recommendation:** Use the interactive cleanup script (`./cleanup-hybrid-files.sh`) and carefully consider each category before removal.
