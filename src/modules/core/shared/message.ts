export type MessageValues = Record<string, string | number>

export type Message = { key: string; values?: MessageValues }

export function message(key: string, values?: MessageValues): Message {
  return values ? { key, values } : { key }
}

export function messageKeys({ key }: Message) {
  return key.startsWith('errors.') ? [key, 'errors.UNKNOWN'] : [key]
}
