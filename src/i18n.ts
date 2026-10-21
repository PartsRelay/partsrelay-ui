import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

type Catalog = Record<string, Record<string, unknown>>

const en: Catalog = import.meta.glob('@/core/locales/en/*.json', { eager: true, import: 'default' })
const it: Catalog = import.meta.glob('@/core/locales/it/*.json', { eager: true, import: 'default' })

const translation = (catalog: Catalog) => Object.assign({}, ...Object.values(catalog))

i18n.on('languageChanged', (language) => document.documentElement.setAttribute('lang', language))

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: translation(en) }, it: { translation: translation(it) } },
    supportedLngs: ['en', 'it'],
    fallbackLng: 'en',
    detection: {
      order: ['navigator'],
      caches: [],
      convertDetectedLanguage: (language) => language.split('-')[0],
    },
    interpolation: { escapeValue: false },
    // Error codes without their own text get the generic one
    parseMissingKeyHandler: (key) => (key.startsWith('errors.') ? i18n.t('errors.unknown') : key),
  })

// Emails the core sends follow the app language
export function localeHeaders() {
  return { 'Accept-Language': i18n.language }
}

export { i18n }
