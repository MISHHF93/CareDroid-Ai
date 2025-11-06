# CareDroid Logo Assets

This directory contains the official CareDroid logo and icon assets.

## Logo Files

- **logo.svg** - Main CareDroid logo (1024x1024, scalable)
- **favicon.svg** - Favicon version (same as logo.svg)

## PWA Icons (PNG)

Generated from logo.svg for Progressive Web App support:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png
- apple-touch-icon.png (180x180)
- favicon.png (32x32)

## Logo Design

The CareDroid logo features:
- **Gradient background**: Light blue (#8FD6F4) to mint green (#A4E3B2)
- **Medical cross**: Green (#51B988) at top
- **Friendly robot face**: White eyes on green base with smile
- **Rounded corners**: 240px border radius for modern look

## Color Palette

```css
Primary Gradient: linear-gradient(135deg, #8FD6F4 0%, #A4E3B2 100%)
Accent Green: #51B988
White: #FFFFFF
```

## Generating Icons

### Automatic (Recommended)

```bash
npm install --save-dev sharp
node scripts/generate-icons.js
```

### Manual

1. Open `/public/logo.svg` in browser or design tool
2. Export as PNG at 1024x1024 resolution
3. Use online tool to batch resize:
   - https://cloudconvert.com/svg-to-png
   - https://www.iloveimg.com/resize-image
4. Save resized PNGs to `/public/` with filenames:
   - icon-72x72.png
   - icon-96x96.png
   - icon-128x128.png
   - icon-144x144.png
   - icon-152x152.png
   - icon-192x192.png
   - icon-384x384.png
   - icon-512x512.png

## Usage in Code

### React Component

```jsx
import Logo from '@/components/Logo';

<Logo size={80} animate />
```

### HTML

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/icon-192x192.png" />
```

### Manifest

```json
{
  "icons": [
    {
      "src": "/logo.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    }
  ]
}
```

## Dark Mode Support

The logo gradient and colors maintain excellent contrast in both light and dark modes:
- Light mode: Full gradient visibility
- Dark mode: Green accents stand out against dark backgrounds

## Brand Guidelines

- **Minimum size**: 32x32px (maintain legibility)
- **Clear space**: 20% of logo width on all sides
- **Background**: Works best on white, light gray, or gradient backgrounds
- **Do not**: Distort proportions, change colors, add effects, rotate

## Accessibility

- Alt text: "CareDroid - AI-Powered Clinical Companion"
- Icon has sufficient contrast (WCAG AAA compliant)
- SVG includes semantic structure for screen readers
