import i18n, { Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import ar from './locales/ar.json';
import ko from './locales/ko.json';
import zh from './locales/zh.json';
import ptBR from './locales/pt-BR.json';
import id from './locales/id.json';
import tr from './locales/tr.json';
import es from './locales/es.json';

export const resources = {
  en: { translation: en },
  ar: { translation: ar },
  ko: { translation: ko },
  zh: { translation: zh },
  'pt-BR': { translation: ptBR },
  id: { translation: id },
  tr: { translation: tr },
  es: { translation: es },
} satisfies Resource;

const deviceLocales = Localization.getLocales();
const tag = (deviceLocales[0]?.languageTag || 'en').replace('_','-');
const guess = tag.startsWith('pt') ? 'pt-BR' : tag.startsWith('es') ? 'es' : tag;

i18n.use(initReactI18next).init({
  resources,
  lng: resources[guess as keyof typeof resources] ? guess : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

export default i18n;