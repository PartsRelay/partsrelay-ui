import { type RefObject, useState } from 'react'

export function useReturnFocus(open: boolean, fallback?: RefObject<HTMLElement | null>) {
  const [opener, setOpener] = useState<HTMLElement | null>(null)
  const [wasOpen, setWasOpen] = useState(open)

  if (open !== wasOpen) {
    const focused = document.activeElement
    setWasOpen(open)
    if (open) setOpener(focused instanceof HTMLElement ? focused : null)
  }

  return (event: Event) => {
    const target = opener?.isConnected ? opener : fallback?.current
    if (!target) return

    event.preventDefault()
    target.focus()
  }
}
