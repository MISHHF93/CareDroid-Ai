# 🚀 CareDroid Quick Start Guide

**Time to First Build:** 5-10 minutes (with prerequisites installed)

---

## ⚡ 30-Second Setup

```bash
# 1. Clone repo
git clone https://github.com/MISHHF93/CareDroid-Ai.git && cd CareDroid-Ai

# 2. Build APK
./build-android-apk.sh debug

# 3. Install
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# 4. Run
adb shell am start -n com.caredroid.clinical.debug/.MainActivity
```

**Done!** ✅ App is running.

---

## 📋 Prerequisites (First Time Only)

### Install Java 17

**macOS:**
```bash
brew install openjdk@17
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install openjdk-17-jdk
```

**Windows:**
- Download: https://www.oracle.com/java/technologies/downloads/#java17
- Run installer

### Install Android Studio

- Download: https://developer.android.com/studio
- Run installer
- During setup, install:
  - Android SDK API Level 35
  - Build Tools 35.0.0

### Verify Installation

```bash
java -version      # Should show Java 17+
echo $JAVA_HOME    # Should show Java path
echo $ANDROID_HOME # Should show Android SDK path
```

---

## 🏗️ Three Ways to Build

### Option 1: Build Script (Easiest) ⭐
```bash
./build-android-apk.sh debug
```
**Output:** `android/app/build/outputs/apk/debug/app-debug.apk`

### Option 2: Gradle Command
```bash
cd android
./gradlew assembleDebug
```

### Option 3: Android Studio
1. Open `android/` folder in Android Studio
2. Click "Build" → "Build Bundle(s) / APK(s)" → "Build APK(s)"

---

## 📱 Deploy to Device

### Prerequisites
- Android device connected via USB
- USB debugging enabled on device
- ADB drivers installed (Android Studio installs these)

### Steps

```bash
# Verify device is connected
adb devices

# Install APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Launch app
adb shell am start -n com.caredroid.clinical.debug/.MainActivity

# View logs (optional)
adb logcat | grep CareDroid
```

---

## 📲 Deploy to Emulator

### Create Emulator (First Time)

1. Open Android Studio
2. Tools → Device Manager
3. Create Virtual Device
4. Choose:
   - Phone: Pixel 5
   - Android Version: 15 (API 35)
   - Name: CareDroid_Emulator

### Launch & Deploy

```bash
# Start emulator (or start from Android Studio)
emulator -avd CareDroid_Emulator &

# Wait for it to boot, then:
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.caredroid.clinical.debug/.MainActivity
```

---

## 🔗 Connect to Backend

The app expects backend server at: **`http://10.0.2.2:8000`** (emulator) or **`http://localhost:8000`** (device)

### Start Backend Server

```bash
# In separate terminal
cd backend
npm install
npm run dev

# Server will start at http://localhost:8000
```

### For Real Device

Edit `android/local.properties`:
```properties
API_BASE_URL=http://YOUR_SERVER_IP:8000
```

---

## 🧪 Run Tests

### Unit Tests
```bash
cd android
./gradlew testDebugUnitTest
```

### UI Tests
```bash
cd android
./gradlew connectedAndroidTest
```

---

## 📊 Check Build Output

```bash
# APK location
ls -lh android/app/build/outputs/apk/debug/app-debug.apk

# APK size
du -h android/app/build/outputs/apk/debug/app-debug.apk

# Verify it's a valid APK
unzip -t android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| `Java not found` | Install Java 17 (see Prerequisites) |
| `Android SDK not found` | Set `ANDROID_HOME` environment variable |
| `Device not found` | Run `adb devices`, enable USB debugging |
| `Build fails` | Run `./gradlew clean` then rebuild |
| `Can't connect to backend` | Verify server is running on correct port |

For more help, see [BUILD_TROUBLESHOOTING.md](./BUILD_TROUBLESHOOTING.md).

---

## 📚 Documentation

| Guide | Purpose |
|-------|---------|
| **This file** | Quick start (you are here) |
| [ANDROID_BUILD_SETUP.md](./ANDROID_BUILD_SETUP.md) | Detailed setup for all options |
| [BUILD_TROUBLESHOOTING.md](./BUILD_TROUBLESHOOTING.md) | Problem solving guide |
| [ANDROID_README.md](./ANDROID_README.md) | Project overview |

---

## 🎯 Next Steps

### After First Build
1. ✅ Verify app launches
2. ✅ Test login/registration
3. ✅ Explore clinical features
4. ✅ Read full documentation

### Development
1. Open `android/` in Android Studio or IDE
2. Modify code in `android/app/src/main/kotlin/`
3. Run `./gradlew assembleDebug` to build
4. Repeat

### Release Build
```bash
./build-android-apk.sh release
# Creates: android/app/build/outputs/apk/release/app-release.apk
```

---

## ✨ Features to Try

Once app is running:

1. **Login** with test credentials
2. **Chat** with AI clinical assistant
3. **Check** drug interactions
4. **Interpret** lab values
5. **Calculate** SOFA scores

All features work with:
- ✅ Real-time backend sync
- ✅ Offline access (previously loaded data)
- ✅ Push notifications

---

## 🔐 Security Note

The debug APK (`app-debug.apk`) is for development only:
- ⚠️ No code obfuscation
- ⚠️ Debuggable
- ⚠️ No signature

For production, build release APK with signing.

---

## 🆘 Still Having Issues?

1. **Check:** All prerequisites installed
2. **Verify:** `java -version` and `adb devices` work
3. **Read:** [BUILD_TROUBLESHOOTING.md](./BUILD_TROUBLESHOOTING.md)
4. **Open:** GitHub Issue with error message

---

## 📞 Need Help?

- **Documentation:** [ANDROID_BUILD_SETUP.md](./ANDROID_BUILD_SETUP.md)
- **Troubleshooting:** [BUILD_TROUBLESHOOTING.md](./BUILD_TROUBLESHOOTING.md)
- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions

---

**Happy coding! 🎉**

Built with ❤️ using Kotlin & Jetpack Compose
