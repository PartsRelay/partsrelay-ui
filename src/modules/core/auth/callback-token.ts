export function readCallbackToken(hash: string) {
  return new URLSearchParams(hash.replace(/^#/, '')).get('token')
}
