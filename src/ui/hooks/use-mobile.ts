import { useSyncExternalStore } from 'react'

const MOBILE_BREAKPOINT = 768

const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
const snapshot = () => window.matchMedia(query).matches
const serverSnapshot = () => false
function subscribe(onChange: () => void) {
  const media = window.matchMedia(query)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot)
}
