import { useTranslation } from 'react-i18next'
import { type ExternalToast, toast } from 'sonner'
import type { Message } from '@/core/message'

function Translated({ text }: { text: Message }) {
  const { t } = useTranslation()

  return t(...text)
}

// Core messages translate on render, so they follow the language
export function notify(tone: 'success' | 'error', text: Message | string, options?: ExternalToast) {
  return toast[tone](typeof text === 'string' ? text : <Translated text={text} />, options)
}
