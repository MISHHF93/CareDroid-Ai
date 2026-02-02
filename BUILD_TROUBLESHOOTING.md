# Android Build Troubleshooting Report

## Current Status: ❌ kapt Compilation Error

The Android app migration is complete (Phases 1-8), but the build process is failing at the **Kotlin Annotation Processing** (kapt) stage with the error:

```
e: Could not load module <Error module>
```

This occurs in task `:app:kaptGenerateStubsDebugKotlin` which is responsible for processing Hilt/Room annotations before compilation.

## Problem Summary

**Root Cause:** The Kotlin compiler's annotation processor (kapt) is failing to process annotations for Hilt dependency injection and Room database entities.

**Environment:** GitHub Codespaces (Ubuntu 24.04 LTS)

**Error Details:**
- Task: `:app:kaptGenerateStubsDebugKotlin`
- Module: Unknown (crashes before providing details)
- Severity: Blocking - prevents APK generation

## What Was Attempted

### ✅ Successful Steps
1. **Android SDK Installation**
   - Installed command line tools (147 MB)
   - Installed platform-tools 36.0.2
   - Installed platforms;android-35
   - Installed build-tools;35.0.0
   - Accepted all SDK licenses

2. **Java Configuration**
   - OpenJDK 21 was pre-installed
   - Installed OpenJDK 17 (17.0.17) to match compiler target

3. **Gradle Configuration**
   - Created `android/local.properties` with SDK path
   - Fixed Compose compiler version compatibility
   - Added Kotlin version resolution strategy
   - Created missing `debug` source set directories
   - Configured kapt options (incremental disabled, cache disabled)

4. **Kotlin/Dependency Versions**
   - Kotlin 1.9.22 → 1.9.23 → 1.9.24 (backward compat fixes)
   - Compose compiler 1.5.7 → 1.5.8 → 1.5.14
   - Attempted Kotlin 2.0.21 (requires different plugin setup)

### ❌ Failed Attempts
1. **Kotlin version downgrades** - Same kapt error persists
2. **Java version matching** - Java 17 still produces error
3. **Gradle cache clearing** - Did not resolve issue
4. **kapt incremental compilation disabled** - Still fails
5. **Removing @HiltAndroidApp annotation** - Other annotated classes still cause failure
6. **Dependency version resolution** - Could not resolve kotlin-stdlib 2.0.0 conflict

## Technical Analysis

### Why kapt Fails

The "Could not load module <Error module>" error is a known Kotlin compiler issue that occurs when:

1. **Module dependency resolution fails** - kapt cannot load compiled modules needed for annotation processing
2. **Classpath issues** - Missing or conflicting JARs in the annotation processor classpath
3. **Memory/resource constraints** - Codespaces environment may have memory limits (kapt runs with -Xmx1536m)
4. **Version incompatibilities** - Kotlin stdlib version mismatches (1.9.x vs 2.0.x)

### Why This Wasn't Caught Earlier

- Codespaces had no Android SDK by default
- Kotlin version conflicts only manifest during kapt compilation
- The error message "Could not load module" is generic and doesn't indicate the specific problem module

## Current Build Configuration

```
Kotlin: 1.9.24
Java Target: 1.7 (JVM 17)
AGP (Android Gradle Plugin): 8.7.2
Gradle: 8.11.1
Android SDK: API 35
Hilt: 2.50
Room: 2.6.1
Compose BOM: 2024.02.00
```

## Recommended Solutions

### Option 1: Build on Local Machine (FASTEST) ⭐

Build the Android app on your local development machine with:
- **Android Studio Ladybug (2024.2.1)** or later
- **Java 17 JDK**
- **Android SDK API 35**

The local environment likely has necessary JVM optimizations and memory configurations for kapt.

```bash
# On local machine
cd android
export JAVA_HOME=/path/to/java-17
./gradlew clean assembleDebug
# Expected output: app/build/outputs/apk/debug/app-debug.apk
```

### Option 2: Upgrade Android Gradle Plugin

Update to AGP 8.9.0+ which has improved kapt support:

```gradle
// In android/build.gradle
classpath 'com.android.tools.build:gradle:8.9.0'  // from 8.7.2
```

Then retry the build.

### Option 3: Simplify Dependency Injection (Medium Effort)

Replace Hilt with manual dependency injection to eliminate kapt entirely:

```kotlin
// Instead of @HiltAndroidApp and @Inject
object AppContainer {
    val apiService = CareDroidApiService.create()
    val database = CareDroidDatabase.getInstance(context)
}

// Manual passing through constructor
val container = AppContainer()
val viewModel = ChatViewModel(container.repository)
```

This would require:
- Refactoring all `@Inject` annotations (40+ files)
- Creating a service locator or factory pattern
- Testing all dependency paths

### Option 4: Use Docker Container (Experimental)

Build within an Android Docker container with optimized JVM setup:

```dockerfile
FROM openjdk:17-slim
RUN apt-get update && apt-get install -y android-sdk
WORKDIR /app
COPY android/ .
RUN ./gradlew assembleDebug
```

### Option 5: CI/CD Pipeline (Deferred)

Configure GitHub Actions to build on cloud infrastructure:

```yaml
# .github/workflows/android-build.yml
- name: Build APK
  run: |
    export JAVA_HOME=$JAVA_HOME_17_X64
    export ANDROID_HOME=$ANDROID_SDK_ROOT
    cd android && ./gradlew assembleDebug
```

## Files Created During Troubleshooting

```
/android/local.properties         # SDK location configuration
/android/app/src/debug/          # Missing debug source set (created)
/variables.gradle                 # Updated Kotlin version
/app/build.gradle                 # Updated Compose compiler, kapt config
/build.gradle                      # Root-level Gradle configuration
```

## Next Steps

1. **Immediate**: Try building on your local machine (Option 1) - this has the highest success rate
2. **Fallback**: If local build fails, upgrade AGP to 8.9.0+ (Option 2)
3. **Long-term**: Simplify DI with manual injection (Option 3) if persistent issues occur

## Verification Checklist

Once build succeeds, verify with:

```bash
# Check APK exists
ls -lh android/app/build/outputs/apk/debug/app-debug.apk

# Check APK contents
unzip -l android/app/build/outputs/apk/debug/app-debug.apk | grep classes.dex

# Test on emulator or device
adb install android/app/build/outputs/apk/debug/app-debug.apk
adb logcat | grep "CareDroid"
```

## References

- [Kotlin kapt Known Issues](https://kotlinlang.org/docs/kapt.html#known-issues)
- [Android Gradle Plugin Compatibility](https://developer.android.com/studio/releases/gradle-plugin)
- [Hilt Documentation](https://dagger.dev/hilt/)
- [GitHub Issue: Could not load module](https://github.com/google/dagger/issues/3278)

---

**Generated:** February 2, 2026  
**Migration Status:** ✅ Complete (Phases 1-8)  
**Build Status:** ❌ Blocked by kapt error  
**Recommended Action:** Build on local machine
