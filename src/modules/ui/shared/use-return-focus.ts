import { useState } from 'react'

export function useReturnFocus(open: boolean) {
  const [opener, setOpener] = useState<HTMLElement | null>(null)
  const [wasOpen, setWasOpen] = useState(open)

  if (open !== wasOpen) {
    const focused = document.activeElement
    setWasOpen(open)
    if (open) setOpener(focused instanceof HTMLElement ? focused : null)
  }

  return (event: Event) => {
    if (!opener?.isConnected) return

    event.preventDefault()
    opener.focus()
  }
}
