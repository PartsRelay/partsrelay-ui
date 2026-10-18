export function redirectPath(path: unknown) {
  return typeof path === 'string' && /^\/(?![/\\])/.test(path) ? path : '/'
}
