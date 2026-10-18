import { useTranslation } from 'react-i18next'
import { type Message, messageKeys } from '@/modules/core/shared/message'

export function useT() {
  const { t } = useTranslation()

  return (value: Message) => value.text ?? t(messageKeys(value), value.values)
}
