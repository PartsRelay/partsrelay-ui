import { useTranslation } from 'react-i18next'
import { type ExternalToast, toast } from 'sonner'
import type { MessageValues } from '@/core/message'

type NotifyOptions = ExternalToast & { values?: MessageValues }

function Translated({ code, values }: { code: string; values?: MessageValues }) {
  const { t } = useTranslation()

  return t(code, values)
}

// Translated on render, so toasts follow the language
export function notify(
  tone: 'success' | 'error',
  code: string,
  { values, ...options }: NotifyOptions = {}
) {
  return toast[tone](<Translated code={code} values={values} />, options)
}
