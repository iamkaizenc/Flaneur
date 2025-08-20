import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  variant?: 'white' | 'icon';
}

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

const LOGO_SIZES = {
  small: 32,
  medium: 64,
  large: 128,
};

const BRAND_LOGO_SIZES = {
  sm: 72,
  md: 112,
  lg: 144,
};

const LOGO_URLS = {
  white: 'https://r2-pub.rork.com/generated-images/c0335cc8-a49c-4ba9-bc24-257b3280e5d9.png',
  icon: 'https://r2-pub.rork.com/generated-images/c0335cc8-a49c-4ba9-bc24-257b3280e5d9.png',
};

const BRAND_LOGO_URL = 'https://r2-pub.rork.com/generated-images/c0335cc8-a49c-4ba9-bc24-257b3280e5d9.png';

export function Logo({ size = 'medium', style, variant = 'white' }: LogoProps) {
  const logoSize = LOGO_SIZES[size];
  const logoUrl = LOGO_URLS[variant];
  
  return (
    <View style={[styles.container, { width: logoSize, height: logoSize }, style]}>
      <Image
        source={{ uri: logoUrl }}
        style={[styles.logo, { width: logoSize, height: logoSize }]}
        resizeMode="contain"
      />
    </View>
  );
}

export function BrandLogo({ size = 'md', style }: BrandLogoProps) {
  const logoSize = BRAND_LOGO_SIZES[size];
  
  return (
    <View style={[styles.brandContainer, { width: logoSize, height: logoSize }, style]}>
      <Image
        source={{ uri: BRAND_LOGO_URL }}
        style={[styles.brandLogo, { width: logoSize, height: logoSize }]}
        resizeMode="contain"
        accessible
        accessibilityRole="image"
        accessibilityLabel="Flâneur logo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    // Minimalist flâneur logo - walking man with elegant typography
  },
  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogo: {
    // Minimalist flâneur logo - clean vector design with gradient background
  },
});