import { useTranslation } from 'react-i18next'
import { type ExternalToast, toast } from 'sonner'
import type { Message } from '@/core/message'

function Translated({ text }: { text: Message }) {
  const { t } = useTranslation()

  return t(...text)
}

// Translated on render, so toasts follow the language
export function notify(tone: 'success' | 'error', text: Message, options?: ExternalToast) {
  return toast[tone](<Translated text={text} />, options)
}
