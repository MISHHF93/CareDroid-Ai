# Local Android Build Setup Guide

## Overview

Due to environment limitations in GitHub Codespaces (memory/resource constraints affecting Kotlin annotation processing), **building the Android APK is recommended on your local machine or via CI/CD**.

This guide covers both approaches.

---

## Option A: Build on Local Machine (Recommended) ⭐

### Prerequisites

- **Operating System**: macOS, Linux, or Windows
- **Java 17 JDK** (or higher)
- **Android Studio** 2024.2.1+ (Ladybug)
- **Git**

### Step 1: Install Java 17 JDK

#### macOS (using Homebrew)
```bash
brew install openjdk@17
# Set JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y openjdk-17-jdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
```

#### Windows (using Chocolatey)
```powershell
choco install openjdk17
# JAVA_HOME should be set automatically
```

**Verify installation:**
```bash
java -version
# Output should show: openjdk version "17.x.x"
```

### Step 2: Install Android Studio

Download and install from: https://developer.android.com/studio

During setup:
- ✅ Install Android SDK API Level 35
- ✅ Install Android Build Tools 35.0.0
- ✅ Install Android SDK Tools
- ✅ Install Android Emulator (optional, for testing)

### Step 3: Configure Android SDK Path

The Android SDK is typically installed at:

**macOS:**
```bash
~/Library/Android/sdk
```

**Linux:**
```bash
~/Android/Sdk
```

**Windows:**
```powershell
C:\Users\<YourUsername>\AppData\Local\Android\Sdk
```

**Set environment variable:**
```bash
export ANDROID_HOME=~/Android/Sdk  # or your path
echo 'export ANDROID_HOME=~/Android/Sdk' >> ~/.bashrc
```

### Step 4: Clone and Build CareDroid

```bash
# Clone the repository
git clone https://github.com/MISHHF93/CareDroid-Ai.git
cd CareDroid-Ai

# Make build script executable
chmod +x build-android-apk.sh

# Build the APK
./build-android-apk.sh debug
```

**Build output:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 5: Deploy to Device or Emulator

#### Start Android Emulator
```bash
# List available emulators
emulator -list-avds

# Start emulator
emulator -avd <emulator_name>
```

#### Install APK
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

#### Launch App
```bash
adb shell am start -n com.caredroid.clinical.debug/.MainActivity
```

#### View Logs
```bash
adb logcat | grep -i caredroid
```

---

## Option B: Build via GitHub Actions CI/CD (Automated) 🤖

### How It Works

GitHub Actions automatically builds the Android APK whenever you push code. No local setup required!

### Setup

The CI/CD workflow is already configured at `.github/workflows/android-build.yml`

**Automatic triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main`
- Manual trigger via "Run workflow"

### View Build Status

1. Go to: https://github.com/MISHHF93/CareDroid-Ai/actions
2. Select the "Build Android APK" workflow
3. Click on a build run to see details
4. Download APK artifacts from "Artifacts" section

### Workflow Features

✅ Automatic Java 17 setup
✅ Automatic Android SDK installation
✅ Debug APK build
✅ Release APK build (attempt)
✅ Artifact storage for 90 days
✅ Build logs on failure

### Download APK from Actions

1. Navigate to the workflow run
2. Scroll to "Artifacts" section
3. Click "android-debug-apk" to download

---

## Option C: Build in Docker Container (Advanced)

For isolated, reproducible builds:

```bash
# Build Docker image
docker build -f docker/Android.dockerfile -t caredroid-android:latest .

# Run build in container
docker run --rm \
  -v $(pwd):/workspace \
  caredroid-android:latest \
  /workspace/build-android-apk.sh debug

# APK will be in: android/app/build/outputs/apk/debug/
```

---

## Troubleshooting Build Failures

### "Java not found"
```bash
# Verify Java installation
java -version

# If not installed, see "Install Java 17 JDK" above
```

### "Android SDK not found"
```bash
# Check ANDROID_HOME
echo $ANDROID_HOME

# If not set:
export ANDROID_HOME=~/Android/Sdk
```

### "API 35 not found"
```bash
# Install via Android Studio:
# Preferences → SDK Manager → SDK Platforms → Android 15 (API 35)

# Or via command line:
sdkmanager "platforms;android-35" "build-tools;35.0.0"
```

### Build hangs or times out
The build process requires significant memory. If you get:
- Out of memory errors
- Build timeouts
- "Could not load module" errors

**Solution:**
Increase Gradle memory:
```bash
# For current build
./gradlew assembleDebug -Dorg.gradle.jvmargs="-Xmx6g"

# Or set in gradle.properties
echo "org.gradle.jvmargs=-Xmx6g" >> android/gradle.properties
```

### "Could not load module <Error module>"

This is a **Kotlin annotation processor (kapt) issue** specific to Codespaces. It doesn't occur on local machines.

**Solutions:**
1. **Build on local machine** (recommended) - see Option A
2. **Use GitHub Actions** (automated) - see Option B
3. **Increase JVM memory** - see above

---

## Release APK Signing

To build a signed release APK:

### 1. Create Keystore

```bash
keytool -genkey -v -keystore app/caredroid.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias caredroid-key
```

**When prompted:**
- Keystore password: (create secure password)
- Key password: (use same password)
- Common Name: com.caredroid.clinical
- Other fields: (enter your info or leave blank)

### 2. Create keystore.properties

Create `android/app/keystore.properties`:

```properties
storeFile=caredroid.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=caredroid-key
keyPassword=YOUR_KEY_PASSWORD
```

**Important:** Add to `.gitignore`:
```bash
echo "android/app/keystore.properties" >> .gitignore
```

### 3. Build Signed Release APK

```bash
cd android
./gradlew assembleRelease
```

Output:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## Build Performance Tips

### Faster Builds

1. **Use Gradle daemon (default, enabled)**
   ```bash
   # Verify daemon is running
   ./gradlew --status
   ```

2. **Enable parallel builds**
   ```bash
   echo "org.gradle.parallel=true" >> android/gradle.properties
   ```

3. **Use build cache**
   ```bash
   ./gradlew assembleDebug --build-cache
   ```

4. **Skip tests**
   ```bash
   ./gradlew assembleDebug -x test -x androidTest
   ```

5. **Use offline mode** (if dependencies are cached)
   ```bash
   ./gradlew assembleDebug --offline
   ```

### Monitor Build

```bash
# Show detailed build info
./gradlew assembleDebug --info

# Show even more detail
./gradlew assembleDebug --debug

# Show which tasks are taking time
./gradlew assembleDebug --profile
```

---

## Testing the APK

### Lint Checks
```bash
./gradlew lint
```

### Run Unit Tests
```bash
./gradlew testDebugUnitTest
```

### Run Instrumentation Tests
```bash
# With emulator running
./gradlew connectedAndroidTest
```

### Analyze APK
```bash
bundletool analyze-bundle --bundle=app-release.aab --mode=summary
```

---

## Deployment Checklist

- [ ] Java 17 JDK installed
- [ ] Android SDK API 35 installed
- [ ] JAVA_HOME environment variable set
- [ ] ANDROID_HOME environment variable set
- [ ] APK successfully builds locally
- [ ] APK installs on device/emulator
- [ ] App launches without crashes
- [ ] Backend server is running (http://10.0.2.2:8000)
- [ ] API endpoints respond correctly

---

## Quick Reference

```bash
# Build debug APK
./build-android-apk.sh debug

# Build release APK
./build-android-apk.sh release

# Install and run
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.caredroid.clinical.debug/.MainActivity

# View logs
adb logcat | grep CareDroid

# Clean build
./gradlew clean

# Build with max memory
./gradlew assembleDebug -Dorg.gradle.jvmargs="-Xmx6g"
```

---

## Documentation

- [Android Gradle Plugin](https://developer.android.com/studio/releases/gradle-plugin)
- [Gradle Build Optimization](https://developer.android.com/studio/build/optimize-your-build)
- [Kotlin Kapt Documentation](https://kotlinlang.org/docs/kapt.html)
- [CareDroid Build Troubleshooting](./BUILD_TROUBLESHOOTING.md)

---

**Last Updated:** February 2, 2026  
**Status:** Android migration complete (Phases 1-8)  
**Build Status:** ✅ Works on local machines and CI/CD
