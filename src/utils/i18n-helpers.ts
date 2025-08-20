import { I18nManager } from 'react-native';

// Text overflow utilities
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// RTL-aware flex direction
export const getFlexDirection = (isRTL: boolean = I18nManager.isRTL): 'row' | 'row-reverse' => {
  return isRTL ? 'row-reverse' : 'row';
};

// RTL-aware text alignment
export const getTextAlign = (isRTL: boolean = I18nManager.isRTL): 'left' | 'right' => {
  return isRTL ? 'right' : 'left';
};

// RTL-aware margin/padding helpers
export const getMarginStart = (value: number, isRTL: boolean = I18nManager.isRTL) => {
  return isRTL ? { marginRight: value } : { marginLeft: value };
};

export const getMarginEnd = (value: number, isRTL: boolean = I18nManager.isRTL) => {
  return isRTL ? { marginLeft: value } : { marginRight: value };
};

export const getPaddingStart = (value: number, isRTL: boolean = I18nManager.isRTL) => {
  return isRTL ? { paddingRight: value } : { paddingLeft: value };
};

export const getPaddingEnd = (value: number, isRTL: boolean = I18nManager.isRTL) => {
  return isRTL ? { paddingLeft: value } : { paddingRight: value };
};

// Format date with locale support
export const formatDate = (date: string | Date, locale: string = 'en'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    // Fallback to English if locale is not supported
    return dateObj.toLocaleDateString('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

// Format number with locale support
export const formatNumber = (number: number, locale: string = 'en'): string => {
  try {
    return number.toLocaleString(locale);
  } catch (error) {
    // Fallback to English if locale is not supported
    return number.toLocaleString('en');
  }
};

// Format percentage with locale support
export const formatPercentage = (number: number, locale: string = 'en'): string => {
  try {
    return (number / 100).toLocaleString(locale, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    });
  } catch (error) {
    // Fallback to English if locale is not supported
    return (number / 100).toLocaleString('en', {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    });
  }
};

// Get chevron icon direction for RTL
export const getChevronDirection = (direction: 'left' | 'right', isRTL: boolean = I18nManager.isRTL): 'left' | 'right' => {
  if (!isRTL) return direction;
  return direction === 'left' ? 'right' : 'left';
};

// Text style helpers for long content
export const getTextStyle = (maxLines?: number) => ({
  ...(maxLines && {
    numberOfLines: maxLines,
    ellipsizeMode: 'tail' as const,
  }),
});

// Common text overflow styles
export const textOverflowStyles = {
  singleLine: {
    numberOfLines: 1,
    ellipsizeMode: 'tail' as const,
  },
  twoLines: {
    numberOfLines: 2,
    ellipsizeMode: 'tail' as const,
  },
  threeLines: {
    numberOfLines: 3,
    ellipsizeMode: 'tail' as const,
  },
} as const;