export type MessageValues = Record<string, string | number>

export type Message = { key: string; values?: MessageValues; text?: string }

export function message(key: string, values?: MessageValues): Message {
  return values ? { key, values } : { key }
}

// Text already translated by the core, the key names it
export function literal(key: string, text: string): Message {
  return { key, text }
}

export function messageKeys({ key }: Message) {
  return key.startsWith('errors.') ? [key, 'errors.UNKNOWN'] : [key]
}
