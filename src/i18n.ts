import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import ICU from 'i18next-icu'
import { initReactI18next } from 'react-i18next'

const files = import.meta.glob<Record<string, unknown>>('./locales/*/*.json', {
  eager: true,
  import: 'default',
})

const resources: Record<string, { translation: Record<string, unknown> }> = {}
for (const [path, messages] of Object.entries(files)) {
  const [, , locale, file] = path.split('/')
  resources[locale] ??= { translation: {} }
  resources[locale].translation[file.replace(/\.json$/, '')] = messages
}

export const locales = Object.keys(resources)

i18n.on('languageChanged', (language) =>
  globalThis.document?.documentElement.setAttribute('lang', language)
)

void i18n
  .use(ICU)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: locales,
    load: 'currentOnly',
    fallbackLng: 'en-US',
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
    parseMissingKeyHandler: (key) =>
      key.startsWith('errors.') ? i18n.t('errors.unknown-error') : key,
  })

export { i18n }
