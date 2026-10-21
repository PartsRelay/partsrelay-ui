import { toast } from 'sonner'
import { i18n } from '@/i18n'

export type NoticeType = 'success' | 'danger' | 'info' | 'warning'

const show = {
  success: toast.success,
  danger: toast.error,
  info: toast.info,
  warning: toast.warning,
}

// One toast per key, so repeats replace each other
export function notify(type: NoticeType, key: string, values?: Record<string, unknown>) {
  return show[type](i18n.t(key, values), { id: key })
}
