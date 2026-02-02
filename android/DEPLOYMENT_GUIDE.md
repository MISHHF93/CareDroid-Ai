# CareDroid Clinical Companion - Deployment Guide

## Overview
This guide covers the complete deployment process for releasing CareDroid Clinical Companion to the Google Play Store.

## Table of Contents
1. [Pre-Deployment Preparation](#pre-deployment-preparation)
2. [Generating Release Keystore](#generating-release-keystore)
3. [Building Release Packages](#building-release-packages)
4. [Testing Release Build](#testing-release-build)
5. [Play Store Preparation](#play-store-preparation)
6. [Uploading to Play Console](#uploading-to-play-console)
7. [Release Tracks](#release-tracks)
8. [Post-Launch Monitoring](#post-launch-monitoring)
9. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Preparation

### 1. Version Management

Update version in `android/app/build.gradle`:

```gradle
defaultConfig {
    versionCode 1          // Increment for each release
    versionName "1.0.0"    // Semantic versioning: MAJOR.MINOR.PATCH
}
```

**Versioning Rules:**
- **versionCode**: Integer that must increase with each release (1, 2, 3, ...)
- **versionName**: User-facing version string (1.0.0, 1.0.1, 1.1.0, ...)

### 2. Run Validation

```bash
cd android
./validate-release.sh
```

This checks:
- Keystore configuration
- ProGuard rules
- Test coverage
- Play Store assets
- Security configurations

### 3. Run Full Test Suite

```bash
# Unit tests
./gradlew test

# Integration tests
./gradlew connectedAndroidTest

# Generate coverage report
./gradlew testDebugUnitTestCoverage
```

Ensure all tests pass before proceeding.

---

## Generating Release Keystore

### First-Time Setup

1. **Generate keystore:**
   ```bash
   cd android
   ./generate-keystore.sh
   ```

2. **You'll be prompted for:**
   - Keystore password (choose strong password)
   - Key password (can be same as keystore password)
   - Your name
   - Organizational unit
   - Organization name
   - City/Locality
   - State/Province
   - Country code (2-letter)

3. **Create keystore.properties:**
   ```bash
   cp app/keystore.properties.template app/keystore.properties
   ```

4. **Fill in your passwords:**
   ```properties
   storeFile=../caredroid-release.keystore
   storePassword=YOUR_ACTUAL_PASSWORD
   keyAlias=caredroid-release
   keyPassword=YOUR_ACTUAL_PASSWORD
   ```

### Security Best Practices

⚠️ **CRITICAL SECURITY NOTES:**

1. **NEVER commit these files to Git:**
   - `caredroid-release.keystore`
   - `keystore.properties`
   
2. **Store securely:**
   - Use password manager for credentials
   - Keep encrypted backup of keystore
   - Store in multiple secure locations
   - If lost, you can NEVER update your app!

3. **Access control:**
   - Limit access to release team only
   - Use separate keystore for development
   - Consider using Play App Signing

### Verify Keystore

```bash
keytool -list -v -keystore caredroid-release.keystore -alias caredroid-release
```

---

## Building Release Packages

### Build Both APK and AAB

```bash
cd android
./build-release.sh
```

This generates:
- **AAB** (App Bundle): `app/build/outputs/bundle/release/app-release.aab`
  - For Play Store upload
  - Smaller download size
  - Dynamic delivery
  
- **APK**: `app/build/outputs/apk/release/app-release.apk`
  - For direct distribution
  - Testing before upload
  - Sideloading

### Manual Build Commands

```bash
# Clean previous builds
./gradlew clean

# Build AAB (recommended for Play Store)
./gradlew bundleRelease

# Build APK (for testing)
./gradlew assembleRelease
```

### Build Verification

Check the output:
```bash
# List build outputs
ls -lh app/build/outputs/bundle/release/
ls -lh app/build/outputs/apk/release/

# Verify signing
jarsigner -verify -verbose -certs app/build/outputs/apk/release/app-release.apk
```

---

## Testing Release Build

### 1. Install APK on Test Device

```bash
# Install release APK
adb install app/build/outputs/apk/release/app-release.apk

# Or if device already has the app
adb install -r app/build/outputs/apk/release/app-release.apk
```

### 2. Test Checklist

- [ ] App launches successfully
- [ ] Login/authentication works
- [ ] Chat interface functional
- [ ] Medication checker works
- [ ] Lab interpreter works
- [ ] SOFA calculator works
- [ ] Offline mode functional
- [ ] Notifications work
- [ ] Biometric auth works
- [ ] No crashes or ANRs
- [ ] Performance is acceptable
- [ ] ProGuard didn't break anything
- [ ] All critical features work

### 3. Test on Multiple Devices

Test on:
- Different Android versions (API 23-35)
- Different screen sizes (phone, tablet)
- Different manufacturers (Samsung, Google, etc.)
- Low-end devices (performance testing)

### 4. Internal Testing

1. Share APK with team members
2. Test for 24-48 hours
3. Collect feedback
4. Fix critical issues
5. Rebuild if necessary

---

## Play Store Preparation

### 1. Create Google Play Developer Account

- Go to: https://play.google.com/console
- Cost: $25 one-time registration fee
- Complete developer profile
- Set up merchant account (if paid app)

### 2. Prepare Store Listing

Use the prepared metadata in `play-store-listing.md`:

**Required Information:**
- App title (50 characters max)
- Short description (80 characters)
- Full description (4000 characters)
- App category: Medical
- Contact email
- Privacy policy URL
- Target age rating: 17+

### 3. Create Graphics Assets

See `PLAY_STORE_GRAPHICS.md` for detailed requirements.

**Required:**
- App icon: 512x512 PNG
- Feature graphic: 1024x500 PNG/JPEG
- Screenshots: 2-8 images (1080x1920 recommended)

**Optional:**
- Promotional video (YouTube URL)
- TV banner
- Wear OS screenshots

### 4. Content Rating

Complete the content rating questionnaire:
- Category: Medical
- Target audience: Healthcare professionals, patients
- Age rating: Mature 17+
- Explain medical content
- No gambling, violence, or explicit content

### 5. Privacy Policy

Requirements:
- Must be hosted at accessible URL
- Must explain data collection
- Must explain data usage
- Must explain data sharing
- Must mention HIPAA compliance
- Must include user rights

Example structure:
```
https://caredroid.ai/privacy

Sections:
1. Introduction
2. Information We Collect
3. How We Use Information
4. Data Security (HIPAA Compliance)
5. User Rights
6. Contact Information
```

---

## Uploading to Play Console

### 1. Create App in Console

1. Go to Play Console: https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - App name: CareDroid - Medical AI Assistant
   - Default language: English (United States)
   - App type: App
   - Free/Paid: Free (or your choice)
4. Accept declarations

### 2. Set Up App Access

- If login required: Provide test credentials
- If special access needed: Provide instructions
- For public access: Select "All functionality available without restrictions"

### 3. Complete Store Listing

**Main Store Listing:**
1. Go to "Store presence" > "Main store listing"
2. Upload app icon (512x512)
3. Add feature graphic (1024x500)
4. Upload phone screenshots (2-8)
5. Fill in app description
6. Add contact details
7. Save

**Categorization:**
- App category: Medical
- Tags: healthcare, medical, ai, HIPAA

### 4. Upload Release Bundle

**Select Release Track:**

1. **Internal Testing** (recommended first):
   - Navigate to "Testing" > "Internal testing"
   - Create new release
   - Upload AAB file
   - Add release notes
   - Review and rollout
   - Share with testers via email list

2. **Closed Testing** (after internal):
   - Navigate to "Testing" > "Closed testing"
   - Create new release
   - Upload AAB
   - Add testers (email list or Google Group)
   - Get feedback for 1-2 weeks

3. **Open Testing** (public beta):
   - Navigate to "Testing" > "Open testing"
   - Anyone can join
   - Larger user base
   - Monitor crash reports

4. **Production** (final release):
   - Navigate to "Release" > "Production"
   - Upload final AAB
   - Add compelling release notes
   - Choose rollout percentage
   - Submit for review

### 5. Release Notes Format

```markdown
Version 1.0.0 - Initial Release

🎉 Welcome to CareDroid Clinical Companion!

✨ Key Features:
• AI-powered medical chat assistant
• Drug interaction checker
• Lab results interpreter
• SOFA score calculator
• Biometric authentication
• Full offline support
• HIPAA-compliant encryption

🔒 Security:
• End-to-end encryption
• Role-based access control
• Secure offline storage

📱 Experience:
• Beautiful Material Design 3 UI
• Dark mode support
• Intuitive navigation
• Fast performance

For support: support@caredroid.ai
Privacy Policy: https://caredroid.ai/privacy
```

### 6. Set Countries/Regions

- Select target countries
- Consider HIPAA/GDPR compliance
- Start with US, expand later

### 7. Pricing & Distribution

- Set price (Free recommended initially)
- Choose distribution channels
- Enable Google Play for Work (optional)

---

## Release Tracks

### Track Strategy

```
Internal Testing (Team only)
    ↓ (1-2 days)
Closed Testing (50-100 users)
    ↓ (1-2 weeks)
Open Testing (Public beta)
    ↓ (2-4 weeks)
Production (Full release)
```

### Track Features

| Track | Audience | Review Time | Rollback |
|-------|----------|-------------|----------|
| Internal | ~100 testers | None | Instant |
| Closed | Email list | None | Instant |
| Open | Public opt-in | None | Instant |
| Production | Everyone | 1-3 days | Manual |

### Staged Rollout

For production, use staged rollout:
1. 5% of users (day 1)
2. 10% (day 2-3)
3. 25% (day 4-5)
4. 50% (day 6-7)
5. 100% (day 8+)

Monitor crashes and ANRs at each stage.

---

## Post-Launch Monitoring

### 1. Android Vitals

Monitor in Play Console:
- **Crashes**: < 1% crash rate
- **ANRs**: < 0.5% ANR rate
- **Wake locks**: Battery drain
- **Startup time**: App launch speed

### 2. Pre-Launch Reports

Google automatically tests on:
- Multiple devices
- Different Android versions
- Various configurations

Review reports and fix issues.

### 3. User Reviews

- Respond to reviews within 24-48 hours
- Address common issues
- Collect feature requests
- Maintain 4.0+ star rating

### 4. Crash Reporting

Integrate Firebase Crashlytics:
```gradle
implementation 'com.google.firebase:firebase-crashlytics-ktx'
```

Monitor:
- Crash-free users percentage
- Most common crashes
- Affected devices/versions

### 5. Analytics

Track key metrics:
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Retention rates (D1, D7, D30)
- Feature usage
- Session duration

### 6. A/B Testing

Use Firebase Remote Config for:
- Feature flags
- UI variations
- Performance optimizations

---

## Troubleshooting

### Build Issues

**Error: Keystore not found**
```
Solution: Verify keystore.properties path
Check: storeFile=../caredroid-release.keystore
```

**Error: R8 optimization failed**
```
Solution: Review ProGuard rules
Add keep rules for problematic classes
Test with minifyEnabled false first
```

**Error: Duplicate classes**
```
Solution: Check dependencies for conflicts
Use ./gradlew dependencies to diagnose
Exclude duplicate transitive dependencies
```

### Upload Issues

**Error: APK signature verification failed**
```
Solution: Verify keystore configuration
Ensure signing config is correct
Check keystore password
```

**Error: Version code already exists**
```
Solution: Increment versionCode in build.gradle
Each upload must have unique versionCode
```

**Error: Missing permissions declaration**
```
Solution: Review AndroidManifest.xml
Declare all required permissions
Add usage descriptions for sensitive permissions
```

### Release Issues

**App rejected for policy violation**
```
Common reasons:
- Missing privacy policy
- Incomplete data safety section
- Medical advice disclaimer missing
- HIPAA compliance not documented

Solution: Address specific violation
Resubmit with corrections
Provide documentation if needed
```

**Crash reports after release**
```
Steps:
1. Check crash statistics in Play Console
2. Review stack traces
3. Reproduce locally if possible
4. Fix and prepare hotfix
5. Release patch version (increment versionCode/Name)
```

---

## Quick Reference

### Essential Commands

```bash
# Validate release
./validate-release.sh

# Generate keystore (first time)
./generate-keystore.sh

# Build release
./build-release.sh

# Deploy (checklist helper)
./deploy-to-playstore.sh

# Test release APK
adb install -r app/build/outputs/apk/release/app-release.apk
```

### Important Files

```
android/
  caredroid-release.keystore        # Release signing key (DON'T COMMIT)
  app/keystore.properties           # Keystore config (DON'T COMMIT)
  app/build.gradle                  # Version & signing config
  app/proguard-rules.pro            # Code optimization rules
  play-store-listing.md             # Store metadata
  PLAY_STORE_GRAPHICS.md            # Asset requirements
  play-store-assets/                # Graphics for store
```

### Support Contacts

- **Google Play Support**: https://support.google.com/googleplay/android-developer
- **Developer Console**: https://play.google.com/console
- **Policy Help**: https://support.google.com/googleplay/android-developer/answer/9859152

---

## Next Steps After Phase 8

1. **Monitor initial feedback** (first 48 hours critical)
2. **Prepare update roadmap** (based on user feedback)
3. **Plan marketing strategy** (app promotion)
4. **Build community** (forums, social media)
5. **Iterate rapidly** (fix bugs, add features)

---

**Congratulations on completing the Android migration! 🎉**

The app is now ready for deployment to Google Play Store. Remember to test thoroughly and monitor closely after launch.
