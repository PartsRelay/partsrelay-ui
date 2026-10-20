export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? [words[0], words.at(-1)] : words.slice(0, 1)

  return letters.map((word) => word!.charAt(0).toUpperCase()).join('')
}
