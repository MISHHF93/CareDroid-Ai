# Play Store Graphics Requirements

## App Icon
- **Size:** 512 x 512 pixels
- **Format:** 32-bit PNG (with alpha)
- **File size:** Maximum 1024 KB
- **Design:** Should represent CareDroid brand
  - Medical/healthcare theme
  - AI/technology elements
  - Professional and trustworthy
  - Distinctive and recognizable
- **Location:** `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (adaptive)

## Feature Graphic
- **Size:** 1024 x 500 pixels
- **Format:** 24-bit PNG or JPEG (no alpha)
- **File size:** Maximum 1024 KB
- **Content:** Hero image for Play Store listing
  - App name/logo
  - Key feature highlights
  - Professional medical imagery
  - Consistent branding

## Screenshots (Required: 2-8 screenshots)

### Phone Screenshots
- **Minimum size:** 320 pixels
- **Maximum size:** 3840 pixels
- **Aspect ratio:** Between 16:9 and 9:16
- **Format:** 24-bit PNG or JPEG (no alpha)
- **Recommended:** 1080 x 1920 pixels (portrait) or 1920 x 1080 (landscape)

**Suggested Screenshots:**
1. Login/Welcome screen
2. Chat interface with AI assistant
3. Medication checker results
4. Lab results interpretation
5. SOFA score calculator
6. Offline mode indication
7. Settings/Profile screen
8. Emergency features

### Tablet Screenshots (Optional)
- **7-inch:** 1024 x 600 pixels minimum
- **10-inch:** 1920 x 1200 pixels minimum
- Same format requirements as phone

## Promotional Video (Optional)
- **Length:** 30 seconds to 2 minutes
- **Format:** YouTube URL
- **Content:**
  - App walkthrough
  - Key features demonstration
  - Professional voiceover
  - Call to action

## Design Guidelines

### Color Scheme
Use CareDroid brand colors from the app theme:
- Primary: Medical blue (#2196F3)
- Secondary: Healthcare green (#4CAF50)
- Background: Clean white/light gray
- Accent: Professional teal (#00BCD4)

### Typography
- Clear, readable fonts
- Professional medical aesthetic
- Consistent with app UI

### Content
- Show actual app UI
- Real features, not mockups
- No misleading information
- Include text overlays for context
- Highlight HIPAA compliance
- Show offline capabilities

## Tools for Creation

### Design Software
- **Figma** - Professional design tool
- **Adobe Photoshop** - Industry standard
- **Canva** - Quick templates
- **GIMP** - Free alternative

### Screenshot Tools
- Android Studio Emulator screenshots
- Physical device screenshots
- Screenshot framing tools:
  - Device Art Generator
  - Previewed.app
  - Screenshot.rocks

### Asset Preparation Script
See `generate-play-store-assets.sh` for automated asset preparation

## Localization
For each supported language, provide:
- Translated app title
- Translated description
- Localized screenshots (optional but recommended)

## Review Checklist
- [ ] All assets meet size requirements
- [ ] No pixelation or compression artifacts
- [ ] Consistent branding across all assets
- [ ] Screenshots show real app UI
- [ ] No personal health information (PHI) in screenshots
- [ ] Feature graphic is eye-catching
- [ ] App icon is distinctive
- [ ] All required assets provided
- [ ] Optional assets added for better visibility

## Storage Location
```
android/
  play-store-assets/
    icon/
      ic_launcher_512.png
    feature-graphic/
      feature_graphic_1024x500.png
    screenshots/
      phone/
        01_login.png
        02_chat.png
        03_medications.png
        04_lab_results.png
        05_sofa_calculator.png
        06_offline.png
        07_settings.png
      tablet/
        (optional tablet screenshots)
    promotional/
      video_url.txt
```

## Next Steps
1. Create assets using the design guidelines
2. Review assets for compliance
3. Upload to Play Console
4. Complete store listing
5. Submit for review
