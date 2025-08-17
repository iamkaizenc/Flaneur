import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  variant?: 'white' | 'icon';
}

const LOGO_SIZES = {
  small: 32,
  medium: 64,
  large: 128,
};

const LOGO_URLS = {
  white: 'https://r2-pub.rork.com/generated-images/daf41c99-b713-4738-90b3-66506472b556.png',
  icon: 'https://r2-pub.rork.com/generated-images/2e232366-2c92-4c53-bf55-5001d2ed8f4d.png',
};

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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    // Flâneur logo - white on transparent for dark backgrounds
  },
});