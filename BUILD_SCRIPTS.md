# CareDroid Clinical Companion - Build Scripts

## Overview
Build and deployment scripts for the native Android application and backend server.

---

## Android Build Scripts

### Build Debug APK
```bash
# Quick debug build
npm run android:build

# Or directly:
cd android
./gradlew assembleDebug

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

### Build Release APK/AAB
```bash
# Build release with signing (requires keystore setup)
npm run android:release

# Or directly:
cd android
./build-release.sh

# Outputs:
# - android/app/build/outputs/bundle/release/app-release.aab (Play Store)
# - android/app/build/outputs/apk/release/app-release.apk (Direct install)
```

### Install on Device
```bash
# Install debug build
npm run android:install

# Or directly:
cd android
./gradlew installDebug

# For release:
adb install app/build/outputs/apk/release/app-release.apk
```

### Run Tests
```bash
# Run Android tests
npm run android:test

# Or directly:
cd android
./gradlew test                    # Unit tests
./gradlew connectedAndroidTest    # Instrumented tests
```

### Validate Release
```bash
# Pre-deployment validation
npm run android:validate

# Or directly:
cd android
./validate-release.sh
```

---

## Backend Build Scripts

### Development Server
```bash
# Start backend in development mode
npm run backend:dev

# Or directly:
cd backend
npm install
npm run start:dev

# Server runs at: http://localhost:8000
```

### Production Build
```bash
# Build for production
npm run backend:build

# Or directly:
cd backend
npm run build

# Start production server
npm run backend:start
```

### Backend Tests
```bash
# Run backend tests
npm run backend:test

# Or directly:
cd backend
npm test
npm run test:e2e
npm run test:cov
```

---

## Docker Scripts

### Start All Services
```bash
# Start backend + database + redis
npm run docker:up

# Or directly:
docker-compose up -d

# Services:
# - Backend API: http://localhost:8000
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

### Stop Services
```bash
npm run docker:down

# Or directly:
docker-compose down
```

### View Logs
```bash
npm run docker:logs

# Or directly:
docker-compose logs -f backend
```

---

## Cleanup Scripts

### Remove Hybrid Files
```bash
# Interactive cleanup
npm run cleanup

# Or directly:
./cleanup-hybrid-files.sh

# Removes:
# - Capacitor config
# - Web build outputs
# - Old build scripts
# - Optional: src/, public/, node_modules, etc.
```

---

## Combined Workflows

### Full Development Setup
```bash
# 1. Start backend
npm run backend:dev

# 2. In another terminal, build Android app
npm run android:build

# 3. Install on device/emulator
npm run android:install

# 4. View logs
adb logcat -s CareDroid
```

### Full Release Build
```bash
# 1. Ensure backend is ready
cd backend
npm run build
npm run test

# 2. Validate Android release
cd ../android
./validate-release.sh

# 3. Build release
./build-release.sh

# 4. Test release build
adb install app/build/outputs/apk/release/app-release.apk

# 5. Deploy to Play Store (manual)
./deploy-to-playstore.sh
```

---

## Environment-Specific Builds

### Android Environment Configuration

**Development (Emulator/USB Debugging):**
```bash
# android/gradle.properties or local.properties
API_BASE_URL=http://10.0.2.2:8000

# Build
./gradlew assembleDebug
```

**Staging:**
```bash
API_BASE_URL=https://staging-api.caredroid.ai

# Build
./gradlew assembleRelease
```

**Production:**
```bash
API_BASE_URL=https://api.caredroid.ai

# Build
./gradlew assembleRelease
```

---

## Backend Environment Configuration

### Development
```bash
# backend/.env.development
NODE_ENV=development
PORT=8000
DATABASE_URL=postgresql://postgres:password@localhost:5432/caredroid_dev
REDIS_URL=redis://localhost:6379

npm run start:dev
```

### Production
```bash
# backend/.env.production
NODE_ENV=production
PORT=8000
DATABASE_URL=postgresql://user:pass@prod-db:5432/caredroid
REDIS_URL=redis://prod-redis:6379
FIREBASE_PROJECT_ID=...
OPENAI_API_KEY=...

npm run build
npm run start:prod
```

---

## CI/CD Scripts (GitHub Actions)

### Android CI Pipeline
```yaml
# .github/workflows/android-ci.yml
name: Android CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Grant execute permission for gradlew
        run: chmod +x android/gradlew
      
      - name: Run tests
        run: cd android && ./gradlew test
      
      - name: Build debug APK
        run: cd android && ./gradlew assembleDebug
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-debug
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

### Backend CI Pipeline
```yaml
# .github/workflows/backend-ci.yml
name: Backend CI

on:
  push:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run tests
        run: cd backend && npm test
      
      - name: Build
        run: cd backend && npm run build
```

---

## Quick Reference Commands

### Android
```bash
# Build & Install
cd android && ./gradlew clean assembleDebug installDebug

# Run specific test
./gradlew test --tests ChatViewModelTest

# Generate test coverage
./gradlew testDebugUnitTestCoverage

# Check for updates
./gradlew dependencyUpdates

# Clean build cache
./gradlew clean --refresh-dependencies
```

### Backend
```bash
# Watch mode
npm run start:dev

# Debug mode
npm run start:debug

# Generate migration
npm run migration:generate -- -n MigrationName

# Run migration
npm run migration:run

# Revert migration
npm run migration:revert
```

### Docker
```bash
# Rebuild services
docker-compose up -d --build

# View specific logs
docker-compose logs -f backend

# Execute command in container
docker-compose exec backend npm run migration:run

# Stop and remove volumes
docker-compose down -v
```

---

## Troubleshooting

### Android Build Issues

**Problem:** Gradle daemon issues
```bash
# Solution:
cd android
./gradlew --stop
./gradlew clean
./gradlew assembleDebug
```

**Problem:** Out of memory
```bash
# Solution: Edit android/gradle.properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m
```

**Problem:** ADB not finding device
```bash
# Solution:
adb kill-server
adb start-server
adb devices
```

### Backend Build Issues

**Problem:** Port already in use
```bash
# Solution: Find and kill process
lsof -ti:8000 | xargs kill -9
```

**Problem:** Database connection failed
```bash
# Solution: Restart docker services
docker-compose restart db
```

---

## Performance Optimization

### Android Build Speed
```bash
# Enable Gradle daemon
echo "org.gradle.daemon=true" >> android/gradle.properties

# Enable parallel execution
echo "org.gradle.parallel=true" >> android/gradle.properties

# Enable build cache
echo "org.gradle.caching=true" >> android/gradle.properties
```

### Backend Build Speed
```bash
# Use npm ci instead of npm install (in CI)
npm ci

# Enable build cache
npm config set cache ~/.npm-cache
```

---

## Summary

### Available Scripts
- `npm run android:build` - Build Android debug APK
- `npm run android:release` - Build Android release
- `npm run android:test` - Run Android tests
- `npm run android:install` - Install on device
- `npm run android:validate` - Pre-release validation
- `npm run backend:dev` - Start backend dev server
- `npm run backend:build` - Build backend for production
- `npm run backend:test` - Run backend tests
- `npm run docker:up` - Start Docker services
- `npm run docker:down` - Stop Docker services
- `npm run cleanup` - Remove hybrid files

### Build Outputs
- Debug APK: `android/app/build/outputs/apk/debug/`
- Release APK: `android/app/build/outputs/apk/release/`
- Release AAB: `android/app/build/outputs/bundle/release/`
- Backend Build: `backend/dist/`

### Logs Locations
- Android Logcat: `adb logcat`
- Backend Logs: `backend/logs/`
- Docker Logs: `docker-compose logs`

---

**For detailed deployment instructions, see:** `android/DEPLOYMENT_GUIDE.md`
