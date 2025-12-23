import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';
import zhTW from './locales/zh-TW.json';

// the translations
const resources = {
  'en': {
    translation: enUS,
  },
  'en-US': {
    translation: enUS,
  },
  'zh': {
    translation: zhCN,
  },
  'zh-CN': {
    translation: zhCN,
  },
  'zh-TW': {
    translation: zhTW,
  },
  'zh-HK': {
    translation: zhTW,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    fallbackLng: 'en-US', // default fallback
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
