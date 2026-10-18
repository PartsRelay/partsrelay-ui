import { type Message, message } from '@/modules/core/shared/message'
import type { Notice } from '@/modules/core/shared/notice'

export async function copyText(text: string, success: Message): Promise<Notice> {
  try {
    await navigator.clipboard.writeText(text)

    return { tone: 'success', message: success }
  } catch {
    return { tone: 'error', message: message('notices.copyFailed') }
  }
}
