import { useTranslation } from 'react-i18next'
import { type ExternalToast, toast } from 'sonner'
import type { MessageValues } from '@/core/message'

type NotifyOptions = ExternalToast & { values?: MessageValues }

// React keeps the key prop, hence i18nKey
function Translated({ i18nKey, values }: { i18nKey: string; values?: MessageValues }) {
  const { t } = useTranslation()

  return t(i18nKey, values)
}

// Translated on render, so toasts follow the language
export function notify(
  tone: 'success' | 'error',
  key: string,
  { values, ...options }: NotifyOptions = {}
) {
  return toast[tone](<Translated i18nKey={key} values={values} />, options)
}
