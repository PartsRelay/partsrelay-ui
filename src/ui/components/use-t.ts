import { useTranslation } from 'react-i18next'
import { type Message, messageKeys } from '@/core/message'

export function useT() {
  const { t } = useTranslation()

  return (text: Message) => t(messageKeys(text), text.values)
}
