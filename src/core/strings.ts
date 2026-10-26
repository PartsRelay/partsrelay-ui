// The longest string the core accepts, like its MAX_STRING_LENGTH
export const MAX_STRING_LENGTH = 255

export function lengthError(value: string) {
  return value.trim().length > MAX_STRING_LENGTH ? 'form.too-long' : undefined
}
