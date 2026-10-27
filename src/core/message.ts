export type MessageValues = Record<string, unknown>

export type Message = [key: string, values?: MessageValues]

export function message(key: string, values?: MessageValues): Message {
  return values ? [key, values] : [key]
}
