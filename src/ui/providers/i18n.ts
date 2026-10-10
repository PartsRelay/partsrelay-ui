import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from '@/ui/locales/en.json'
import it from '@/ui/locales/it.json'

i18n.on('languageChanged', (language) => document.documentElement.setAttribute('lang', language))

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, it: { translation: it } },
    supportedLngs: ['en', 'it'],
    fallbackLng: 'en',
    detection: {
      order: ['navigator'],
      caches: [],
      convertDetectedLanguage: (language) => language.split('-')[0],
    },
    interpolation: { escapeValue: false },
  })

export { i18n }
