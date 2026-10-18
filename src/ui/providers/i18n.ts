import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { type Message, messageKeys } from '@/modules/core/shared/message'

type Catalog = Record<string, Record<string, unknown>>

const en: Catalog = import.meta.glob('@/ui/locales/en/*.json', { eager: true, import: 'default' })
const it: Catalog = import.meta.glob('@/ui/locales/it/*.json', { eager: true, import: 'default' })

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
  })

export function translate(text: Message) {
  return i18n.t(messageKeys(text), text.values)
}

export { i18n }
