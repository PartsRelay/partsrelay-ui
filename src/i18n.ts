import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { env } from '@/env'

const files = import.meta.glob<Record<string, unknown>>('./locales/*/*.json', {
  eager: true,
  import: 'default',
})

const resources: Record<string, { translation: Record<string, unknown> }> = {}
for (const [path, texts] of Object.entries(files)) {
  const [, , locale] = path.split('/')
  resources[locale] = { translation: { ...resources[locale]?.translation, ...texts } }
}

i18n.on('languageChanged', (language) =>
  globalThis.document?.documentElement.setAttribute('lang', language)
)

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: Object.keys(resources),
    load: 'currentOnly',
    fallbackLng: 'en-US',
    detection: { order: ['navigator'], caches: [] },
    interpolation: {
      escapeValue: false,
      defaultVariables: { app: env.APP_NAME },
    },
    parseMissingKeyHandler: (key) =>
      key.startsWith('errors.') ? i18n.t('errors.unknown-error') : key,
  })

export { i18n }
