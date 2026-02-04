# 📋 CareDroid-AI Complete File Index

**Comprehensive index of all important files and their purposes**

## 🏠 Root Directory

### Documentation
- **[README.md](README.md)** - Main project documentation
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick command reference
- **[SYSTEM_WIRING.md](SYSTEM_WIRING.md)** - Architecture and system connections

### Configuration Files
- **[package.json](package.json)** - Frontend dependencies and scripts
- **[vite.config.js](vite.config.js)** - Vite build configuration and dev server
- **[vitest.config.js](vitest.config.js)** - Frontend test configuration
- **[capacitor.config.json](capacitor.config.json)** - Mobile app configuration
- **[.eslintrc.cjs](.eslintrc.cjs)** - ESLint code style rules
- **[.prettierrc](.prettierrc)** - Prettier code formatting
- **[.gitignore](.gitignore)** - Git ignore patterns
- **[.env.example](.env.example)** - Environment variable template

### Entry Points
- **[index.html](index.html)** - HTML entry point for the app

---

## 📱 Frontend (`src/`)

### Core Files
- **[src/main.jsx](src/main.jsx)** - Application entry point & initialization
- **[src/App.jsx](src/App.jsx)** - Root component with routing
- **[src/index.css](src/index.css)** - Global styles

### Configuration
- **[src/config/appConfig.js](src/config/appConfig.js)** - Application configuration

### Pages (`src/pages/`)
All route-level components for different views:
- Login/Register pages
- Dashboard
- Chat interface
- Clinical tools
- Patient management
- Analytics
- Admin panel
- Settings

### Components (`src/components/`)
Reusable UI components:
- Buttons, forms, modals
- Charts and visualizations
- Clinical-specific components
- Layout components

### Services (`src/services/`)
API and external service integrations:
- **authService.js** - Authentication API calls
- **chatService.js** - Chat/messaging
- **patientService.js** - Patient data management
- **clinicalService.js** - Clinical operations
- **analyticsService.js** - Analytics tracking
- **syncService.js** - Offline sync
- **offlineService.js** - Offline capabilities
- **NotificationService.js** - Push notifications
- **crashReportingService.js** - Error tracking

### Contexts (`src/contexts/`)
React context providers for state management:
- **AuthContext.jsx** - Authentication state
- **ThemeContext.jsx** - UI theme
- **NotificationContext.jsx** - Notifications

### Utilities (`src/utils/`)
Helper functions and utilities:
- **logger.js** - Logging utility
- **validation.js** - Input validation
- **formatting.js** - Data formatting

### Database (`src/db/`)
IndexedDB configuration for offline storage:
- **db.js** - Dexie database setup

### Hooks (`src/hooks/`)
Custom React hooks:
- **useAuth.js** - Authentication hook
- **useNotifications.js** - Notifications hook
- **useOffline.js** - Offline status hook

### Tests (`src/test/`)
Frontend unit tests

---

## 🔧 Backend (`backend/`)

### Core Files
- **[backend/package.json](backend/package.json)** - Backend dependencies
- **[backend/nest-cli.json](backend/nest-cli.json)** - NestJS CLI config
- **[backend/tsconfig.json](backend/tsconfig.json)** - TypeScript configuration
- **[backend/Dockerfile](backend/Dockerfile)** - Docker image definition

### Source (`backend/src/`)
- **app.module.ts** - Main application module
- **main.ts** - Application entry point
- **config/** - Configuration files
  - database.config.ts
  - redis.config.ts
  - auth.config.ts
  - firebase.config.ts
  - openai.config.ts
  - etc.
- **modules/** - Feature modules
  - auth/ - Authentication
  - users/ - User management
  - chat/ - Chat functionality
  - clinical/ - Clinical operations
  - ai/ - AI services
  - analytics/ - Analytics
  - audit/ - Audit logging
  - compliance/ - HIPAA compliance
  - notifications/ - Push notifications
  - rag/ - RAG (Retrieval Augmented Generation)

### Tests (`backend/test/`)
Backend unit and E2E tests

### Scripts (`backend/scripts/`)
Utility scripts for backend operations

---

## 📦 Tests (`tests/`)

### Documentation
- **[tests/README.md](tests/README.md)** - Testing guide

### Frontend Tests (`tests/frontend/`)
- **test-routes.js** - Route health check
- **test-routes-comprehensive.js** - Detailed route testing
- **test-runner-full.js** - Full frontend test runner

### Integration Tests (`tests/integration/`)
- **test-phase5-output.txt** - Integration test results

### Test Tools (`tests/tools/`)
- **test-runner.py** - Python test orchestrator
- **test-runner.kts** - Kotlin test runner

---

## 🚀 Deployment (`deployment/`)

### Documentation
- **[deployment/README.md](deployment/README.md)** - Deployment guide

### Docker (`deployment/docker/`)
- **docker-compose.yml** - Multi-service orchestration
- **Dockerfile.android** - Android build container
- **docker-android-emulator.sh** - Android emulator script

### Android (`deployment/android/`)
- **build-android-apk.sh** - Main APK build script
- **build-android.ps1** - Windows build script
- **setup-android-sdk.sh** - SDK setup
- **install-android-sdk-simple.sh** - Simplified SDK install
- **cleanup-hybrid-files.sh** - Clean build artifacts
- **package.android.json** - Android-specific dependencies

---

## 📱 Android (`android/`)

### Core Files
- **build.gradle** - Project-level build configuration
- **settings.gradle** - Gradle settings
- **gradle.properties** - Gradle properties
- **variables.gradle** - Custom Gradle variables
- **capacitor.settings.gradle** - Capacitor configuration
- **gradlew** / **gradlew.bat** - Gradle wrapper scripts
- **local.properties** - Local SDK paths

### Build Scripts
- **build-apk.ps1** - PowerShell build script
- **build-release.sh** - Release build script
- **build.ps1** - Alternative build script
- **generate-keystore.sh** - Keystore generation
- **validate-release.sh** - Release validation
- **deploy-to-playstore.sh** - Play Store deployment

### Metadata
- **app-store-metadata.yml** - App store listing info

### App Directory (`android/app/`)
- **build.gradle** - App-level build config
- **src/** - Android source code
  - main/kotlin/ - Kotlin source
  - main/java/ - Java source (if any)
  - main/res/ - Resources
  - main/AndroidManifest.xml
  - test/ - Unit tests
  - androidTest/ - Instrumented tests

### Assets (`android/play-store-assets/`)
Graphics and screenshots for Play Store

---

## ⚙️ Configuration (`config/`)

### Monitoring
- **prometheus.yml** - Prometheus metrics config
- **logstash.conf** - Logstash log processing

### Subdirectories
- **prometheus/** - Prometheus configuration
- **grafana/** - Grafana dashboards
- **kibana/** - Kibana settings
- **alertmanager/** - Alert configuration

---

## 🔧 Scripts (`scripts/`)

### Utilities
- **generate-icons.js** - Icon generation utility

---

## 📄 Public Assets (`public/`)

### Service Workers
- **firebase-messaging-sw.js** - Firebase messaging service worker
- **sw.js** - General service worker

---

## 🛠️ Debug Tools (`.debug-tools/`)

### Debug Utilities
- **AUTH_DEBUG_TEST.html** - Authentication debug page

---

## 📚 Documentation Archive (`docs/`)

### Guides (`docs/guides/`)
Future location for user guides and tutorials

### Archive (`docs/archive/`)
Historical documentation and phase completion reports:
- Phase completion documents
- Migration guides
- Implementation reports
- Architecture documents
- Progress tracking

---

## 🔄 GitHub Actions (`.github/workflows/`)

### CI/CD Pipelines
- **ci-cd.yml** - Main CI/CD pipeline
- **test.yml** - Test automation
- **build-android.yml** - Android build automation
- **android-build.yml** - Android build workflow
- **android-release.yml** - Android release workflow
- **quality.yml** - Code quality checks
- **dependency-updates.yml** - Dependency management
- **release.yml** - Release automation

---

## 📊 File Count Summary

```
Total organized structure:
├── Frontend source: ~100+ files
├── Backend source: ~200+ files
├── Android native: ~50+ files
├── Tests: ~20+ files
├── Configuration: ~30+ files
├── Documentation: ~10 active, ~40 archived
└── CI/CD: ~8 workflow files
```

## 🗂️ Key Directories by Function

### Development
- `src/` - Frontend development
- `backend/src/` - Backend development
- `android/app/src/` - Android development

### Testing
- `tests/` - All test files
- `src/test/` - Frontend unit tests
- `backend/test/` - Backend tests

### Configuration
- Root config files - Build & dev tools
- `config/` - Monitoring & observability
- `backend/src/config/` - Backend configs

### Deployment
- `deployment/` - All deployment scripts
- `.github/workflows/` - CI/CD automation
- `android/` - Android build configs

### Documentation
- Root `.md` files - Active documentation
- `docs/archive/` - Historical docs
- Individual README files in subdirectories

---

## 🎯 Quick File Lookup

### Need to...

**Start development?**
→ Check `package.json` scripts and `.env.example`

**Configure API?**
→ Edit `vite.config.js` proxy settings

**Modify database?**
→ Check `backend/src/config/database.config.ts`

**Add a route?**
→ Edit `src/App.jsx`

**Create a component?**
→ Add to `src/components/`

**Build Android?**
→ Use `deployment/android/build-android-apk.sh`

**Deploy to production?**
→ See `deployment/README.md`

**Run tests?**
→ Check `tests/README.md`

**Troubleshoot?**
→ Check `SYSTEM_WIRING.md`

---

**Last Updated:** February 2026  
**Maintained by:** CareDroid DevOps Team

*This index is automatically maintained. If you move files, please update this document.*
