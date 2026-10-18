import { type Message, message } from '@/modules/core/shared/message'

export const NAME_MAX = 255

export function checkName(draft: string, required: Message) {
  const value = draft.trim()
  if (value === '') return { value, error: required }
  if (value.length > NAME_MAX) {
    return { value, error: message('validation.tooLong', { max: NAME_MAX }) }
  }

  return { value, error: null }
}
