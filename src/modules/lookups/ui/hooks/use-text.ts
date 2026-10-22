import { useTranslation } from 'react-i18next'
import type { Message } from '@/core/message'

export function useText() {
  const { t } = useTranslation()

  return (value: string | Message) => (typeof value === 'string' ? value : t(...value))
}
