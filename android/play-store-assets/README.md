# Play Store Asset Generation Script

This directory contains assets for Google Play Store listing.

## Required Assets

### 1. App Icon (512x512)
- Location: `icon/ic_launcher_512.png`
- Requirements: 32-bit PNG with alpha, max 1024 KB
- Status: ⏳ **TO BE CREATED**

### 2. Feature Graphic (1024x500)
- Location: `feature-graphic/feature_graphic_1024x500.png`
- Requirements: 24-bit PNG/JPEG, max 1024 KB
- Status: ⏳ **TO BE CREATED**

### 3. Phone Screenshots (2-8 required)
- Location: `screenshots/phone/`
- Requirements: 1080x1920 or similar, PNG/JPEG
- Suggested screenshots:
  1. `01_login.png` - Login/Welcome screen
  2. `02_chat.png` - AI chat interface
  3. `03_medications.png` - Drug checker
  4. `04_lab_results.png` - Lab interpreter
  5. `05_sofa_calculator.png` - SOFA calculator
  6. `06_offline.png` - Offline mode
  7. `07_settings.png` - Settings/Profile
- Status: ⏳ **TO BE CREATED**

## How to Create Assets

### Using Android Studio
1. Run the app on an emulator or device
2. Navigate to each screen
3. Take screenshots using:
   - Emulator: Camera button in toolbar
   - Device: Power + Volume Down
4. Save to `screenshots/phone/`

### Using Design Tools
1. Export icon from `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`
2. Scale to 512x512 for Play Store
3. Create feature graphic using:
   - Figma template: https://www.figma.com/community
   - Canva template: Search "Google Play Feature Graphic"
   - Custom design matching CareDroid branding

### Screenshot Enhancement (Optional)
- Use tools like:
  - Device Art Generator (Android Studio)
  - Screenshot.rocks
  - Previewed.app
- Add device frames
- Include descriptive text overlays

## Validation Checklist

Before uploading to Play Console:

- [ ] App icon is 512x512, 32-bit PNG, < 1024 KB
- [ ] Feature graphic is 1024x500, 24-bit PNG/JPEG, < 1024 KB
- [ ] At least 2 screenshots provided
- [ ] Screenshots are 1080x1920 or similar aspect ratio
- [ ] No pixelation or compression artifacts
- [ ] No personal health information (PHI) visible
- [ ] Consistent branding across all assets
- [ ] Screenshots show actual app UI
- [ ] All text is readable

## Current Status

📊 **Assets Completed:** 0/10

Once assets are created, update this README with completion status.

## Next Steps

1. Create/export app icon (512x512)
2. Design feature graphic (1024x500)
3. Take app screenshots (minimum 2, recommended 7)
4. Validate all assets meet requirements
5. Upload to Google Play Console
6. Complete store listing with metadata
