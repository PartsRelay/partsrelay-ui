export function redirectPath(path: unknown) {
  if (typeof path !== 'string' || !path.startsWith('/')) return '/'
  let decoded = path
  // Reject URL forms which browsers normalize into another origin.
  for (let count = 0; count < 3; count += 1) {
    const unsafeCharacter = [...decoded].some((character) => {
      const code = character.charCodeAt(0)
      return character === '\\' || code < 32 || code === 127
    })
    if (decoded.startsWith('//') || unsafeCharacter) return '/'
    try {
      const next = decodeURIComponent(decoded)
      if (next === decoded) return path
      decoded = next
    } catch {
      return '/'
    }
  }
  return '/'
}
