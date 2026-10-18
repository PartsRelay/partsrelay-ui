import type { Message } from '@/modules/core/shared/message'

export type ConfirmFact = { label: Message; value: Message | string }

export type ConfirmSpec = {
  title: Message
  body: Message
  action: Message
  tone: 'danger' | 'primary'
  typeToConfirm?: string
  facts?: ConfirmFact[]
  acknowledge?: Message
}

export function canConfirm(spec: ConfirmSpec, typed: string, acknowledged = false) {
  return (
    (spec.typeToConfirm === undefined || typed.trim() === spec.typeToConfirm.trim()) &&
    (spec.acknowledge === undefined || acknowledged)
  )
}
