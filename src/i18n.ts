import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { MAX_STRING_LENGTH } from '@/core/strings'
import { env } from '@/env'

type Catalog = Record<string, Record<string, unknown>>

const enUS: Catalog = import.meta.glob('@/locales/en-US/*.json', {
  eager: true,
  import: 'default',
})
const itIT: Catalog = import.meta.glob('@/locales/it-IT/*.json', {
  eager: true,
  import: 'default',
})

const translation = (catalog: Catalog) => Object.assign({}, ...Object.values(catalog))

i18n.on('languageChanged', (language) => document.documentElement.setAttribute('lang', language))

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'en-US': { translation: translation(enUS) },
      'it-IT': { translation: translation(itIT) },
    },
    // Browser languages like it or it-CH resolve to it-IT
    supportedLngs: ['en-US', 'it-IT'],
    load: 'currentOnly',
    fallbackLng: 'en-US',
    detection: { order: ['navigator'], caches: [] },
    // {{app}} is the app name from the environment
    interpolation: {
      escapeValue: false,
      defaultVariables: { app: env.APP_NAME, maxLength: MAX_STRING_LENGTH },
    },
    // Error codes without their own text get the generic one
    parseMissingKeyHandler: (key) =>
      key.startsWith('errors.') ? i18n.t('errors.unknown-error') : key,
  })

export { i18n }
