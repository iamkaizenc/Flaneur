# Flâneur Brand Assets

This directory contains all brand assets for the Flâneur autonomous social media agency app.

## Files

### Logo Assets
- `flaneur-logo-white.png` - Main logo, white on transparent (1024x1024)
- `flaneur-logo-white@2x.png` - 2x version for high-DPI displays
- `flaneur-logo-white@3x.png` - 3x version for high-DPI displays
- `flaneur-mark.svg` - Vector version for scalable use

### App Icons
- `flaneur-icon-ios-1024.png` - iOS App Store icon (1024x1024, black background)
- `flaneur-adaptive-foreground.png` - Android adaptive icon foreground (432x432)
- `flaneur-adaptive-background.png` - Android adaptive icon background (108x108, black)
- `flaneur-favicon.png` - Web favicon (512x512)

## Usage Guidelines

### Colors
- Primary: Black (#000000)
- Secondary: White (#FFFFFF)
- Use high contrast combinations only

### Typography
- Headings: Serif fonts
- Body text: Sans-serif fonts
- Logo: Custom serif wordmark

### Logo Usage
- Always use white logo on dark backgrounds
- Maintain clear space around logo
- Do not modify or distort the logo
- Minimum size: 32px height

## Current Asset URLs

The assets are currently hosted at:
- Main logo (white on transparent): https://r2-pub.rork.com/generated-images/daf41c99-b713-4738-90b3-66506472b556.png
- iOS app icon (white on black): https://r2-pub.rork.com/generated-images/2e232366-2c92-4c53-bf55-5001d2ed8f4d.png

## App Configuration

To use these assets in your Expo app, update your `app.json`:

```json
{
  "expo": {
    "name": "Flâneur",
    "icon": "./assets/brand/flaneur-icon-ios-1024.png",
    "splash": {
      "image": "./assets/brand/flaneur-logo-white.png",
      "backgroundColor": "#000000"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/brand/flaneur-adaptive-foreground.png",
        "backgroundImage": "./assets/brand/flaneur-adaptive-background.png"
      }
    }
  }
}
```