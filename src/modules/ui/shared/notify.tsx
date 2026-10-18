import { type ExternalToast, toast } from 'sonner'
import type { Message } from '@/modules/core/shared/message'
import { useT } from '@/modules/ui/shared/use-t'

function Translated({ text }: { text: Message }) {
  const translate = useT()

  return translate(text)
}

// Translated on render, so toasts follow the language
export function notify(tone: 'success' | 'error', text: Message, options?: ExternalToast) {
  return toast[tone](<Translated text={text} />, options)
}
