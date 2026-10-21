export type MessageValues = Record<string, unknown>

// Arguments for t, so a message translates with t(...message)
export type Message = [key: string, values?: MessageValues]

export function message(key: string, values?: MessageValues): Message {
  return values ? [key, values] : [key]
}
