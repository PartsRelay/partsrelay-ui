import { env } from '@/env'
import { i18n } from '@/i18n'

export function appHead() {
  return { meta: [{ title: env.APP_NAME }] }
}

export function pageHead(key: string) {
  return () => ({ meta: [{ title: i18n.t('app.title', { page: i18n.t(key) }) }] })
}
