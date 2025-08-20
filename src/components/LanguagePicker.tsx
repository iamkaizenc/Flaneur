import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLanguage } from '../providers/LanguageProvider';
import { useTranslation } from 'react-i18next';

const opts = [
  { code:'en', label:'English' },
  { code:'es', label:'Español' },
  { code:'tr', label:'Türkçe' },
  { code:'ar', label:'العربية' },
  { code:'ko', label:'한국어' },
  { code:'zh', label:'中文' },
  { code:'pt-BR', label:'Português (BR)' },
  { code:'id', label:'Bahasa Indonesia' },
] as const;

export const LanguagePicker: React.FC = () => {
  const { lang, setLang } = useLanguage(); 
  const { t } = useTranslation();
  
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('settings.language')}</Text>
      <View style={styles.optionsContainer}>
        {opts.map(option => {
          const isSelected = lang === option.code;
          return (
            <Pressable 
              key={option.code} 
              onPress={() => setLang(option.code as any)}
              style={[
                styles.optionButton,
                isSelected ? styles.optionButtonSelected : styles.optionButtonDefault
              ]}
              android_ripple={{ color: '#00000020' }}
            >
              <Text style={[
                styles.optionText,
                isSelected ? styles.optionTextSelected : styles.optionTextDefault
              ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#374151', // gray-700
    marginBottom: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  optionButtonDefault: {
    borderColor: '#D1D5DB', // gray-300
    backgroundColor: '#F9FAFB', // gray-50
  },
  optionButtonSelected: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  optionTextDefault: {
    color: '#374151', // gray-700
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
});