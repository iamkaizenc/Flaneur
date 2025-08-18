import React, { createContext, useCallback, useContext, useEffect, useState, useMemo } from 'react';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import i18n from '../i18n';

type Lang = 'en'|'ar'|'ko'|'zh'|'pt-BR'|'id'|'tr';
type Ctx = { lang: Lang; setLang: (l: Lang)=>Promise<void>; isRTL: boolean; };
const C = createContext<Ctx>({ lang:'en', setLang: async()=>{}, isRTL:false });

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({children})=>{
  const [lang, setLangState] = useState<Lang>((i18n.language as Lang) || 'en');
  const applyRTL = useCallback(async(rtl:boolean)=>{
    if(I18nManager.isRTL!==rtl){
      I18nManager.allowRTL(rtl); I18nManager.forceRTL(rtl);
      if(Platform.OS!=='web'){ try{ await Updates.reloadAsync(); }catch{} }
    }
  },[]);
  const setLang = useCallback(async(l:Lang)=>{
    await i18n.changeLanguage(l); setLangState(l);
    await AsyncStorage.setItem('@lang', l); await applyRTL(l==='ar');
  },[applyRTL]);
  useEffect(()=>{ (async()=>{
    const saved = await AsyncStorage.getItem('@lang') as Lang|null;
    const target = saved || lang; await i18n.changeLanguage(target);
    setLangState(target); await applyRTL(target==='ar');
  })(); },[applyRTL, lang]);
  const value = useMemo(() => ({ lang, setLang, isRTL: lang==='ar' }), [lang, setLang]);
  return <C.Provider value={value}>{children}</C.Provider>;
};
export const useLanguage = ()=>useContext(C);