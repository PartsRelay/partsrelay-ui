import { type Message, message } from '@/core/message'
import type { Notice } from '@/core/notice'

export async function copyText(text: string, success: Message): Promise<Notice> {
  try {
    await navigator.clipboard.writeText(text)

    return { tone: 'success', message: success }
  } catch {
    return { tone: 'error', message: message('notices.copyFailed') }
  }
}
