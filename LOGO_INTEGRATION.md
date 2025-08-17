# Flâneur Logo Integration Guide

This guide explains how to integrate the Flâneur logo assets into your mobile application.

## Generated Logo Assets

The following logo assets have been generated and are ready for download:

### 1. Main Logo (White on Transparent)
- **URL**: https://r2-pub.rork.com/generated-images/daf41c99-b713-4738-90b3-66506472b556.png
- **Size**: 1024x1024
- **Usage**: Main logo for splash screen, onboarding, and headers
- **Save as**: `assets/brand/flaneur-logo-white.png`

### 2. iOS App Icon (White on Black)
- **URL**: https://r2-pub.rork.com/generated-images/2e232366-2c92-4c53-bf55-5001d2ed8f4d.png
- **Size**: 1024x1024
- **Usage**: iOS app icon with black background
- **Save as**: `assets/brand/flaneur-icon-ios-1024.png`

### 3. Android Adaptive Icon Assets
- **Foreground**: Use the main logo (URL above) as foreground
- **Background**: Create solid black background (#000000)
- **Save as**: `assets/brand/flaneur-adaptive-foreground.png` and `assets/brand/flaneur-adaptive-background.png`

## Required app.json Updates

Update your `app.json` file with the following changes:

```json
{
  "expo": {
    "name": "Flâneur",
    "slug": "flaneur-autonomous-social-media",
    "icon": "./assets/brand/flaneur-icon-ios-1024.png",
    "splash": {
      "image": "./assets/brand/flaneur-logo-white.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.flaneur.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/brand/flaneur-adaptive-foreground.png",
        "backgroundImage": "./assets/brand/flaneur-adaptive-background.png"
      },
      "package": "com.flaneur.app"
    },
    "web": {
      "favicon": "./assets/brand/flaneur-logo-white.png"
    }
  }
}
```

## Installation Steps

1. **Create the brand directory**:
   ```bash
   mkdir -p assets/brand
   ```

2. **Download the logo assets**:
   ```bash
   # Download main logo (white on transparent)
   curl -o assets/brand/flaneur-logo-white.png "https://r2-pub.rork.com/generated-images/daf41c99-b713-4738-90b3-66506472b556.png"
   
   # Download iOS icon (white on black)
   curl -o assets/brand/flaneur-icon-ios-1024.png "https://r2-pub.rork.com/generated-images/2e232366-2c92-4c53-bf55-5001d2ed8f4d.png"
   
   # Use main logo as Android adaptive foreground
   cp assets/brand/flaneur-logo-white.png assets/brand/flaneur-adaptive-foreground.png
   ```

3. **Update app.json** with the configuration above

4. **Clear Expo cache and rebuild**:
   ```bash
   expo r -c
   ```

## Logo Component Usage

The `Logo` component is available for use throughout the app:

```tsx
import { Logo } from '@/components/Logo';

// Usage examples
<Logo size="small" />   // 32x32
<Logo size="medium" />  // 64x64 (default)
<Logo size="large" />   // 128x128
```

## Design Guidelines

- **Background**: Always use the white logo on dark backgrounds (#000000)
- **Contrast**: Ensure adequate contrast ratios for accessibility
- **Spacing**: Maintain proper padding around the logo
- **Scaling**: Use appropriate sizes for different contexts

## Current Integration

The logo has been integrated into:
- ✅ Onboarding screen (large logo in brand header)
- ✅ Flow screen header (small logo with brand name)
- ✅ Logo component for reusable usage
- ✅ Theme constants updated with Flâneur branding

## Next Steps

1. Download the logo assets using the URLs above
2. Update your `app.json` file
3. Test the app on both iOS and Android devices
4. Verify the splash screen and app icon display correctly

The logo maintains the premium, minimalist aesthetic of the Flâneur brand with clean white lines on dark backgrounds, perfect for the monochrome design system.