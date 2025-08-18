import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLanguage } from '../providers/LanguageProvider';
import { useTranslation } from 'react-i18next';

const opts = [
  { code:'en', label:'English' },
  { code:'tr', label:'Türkçe' },
  { code:'ar', label:'العربية' },
  { code:'ko', label:'한국어' },
  { code:'zh', label:'中文' },
  { code:'pt-BR', label:'Português (BR)' },
  { code:'id', label:'Bahasa Indonesia' },
] as const;

export const LanguagePicker: React.FC = ()=>{
  const { lang, setLang } = useLanguage(); 
  const { t } = useTranslation();
  
  return (
    <View style={{ gap:8 }}>
      <Text style={{ fontSize:14, opacity:0.7, color: '#fff' }}>{t('settings.language')}</Text>
      <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
        {opts.map(o=>(
          <Pressable key={o.code} onPress={()=>setLang(o.code as any)}
            style={{
              paddingVertical:8, paddingHorizontal:12, borderRadius:8,
              borderWidth:1, borderColor: lang===o.code?'#fff':'#666',
              backgroundColor: lang===o.code?'#111':'transparent'
            }}>
            <Text style={{ color:'#fff' }}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};